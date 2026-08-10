import * as SQLite from "expo-sqlite"
import {
	SQL_GC_DROP_TRIGGERS,
	SQL_GC_SWEEP,
	SQL_GC_TRIGGERS,
	SQL_SCHEMA
} from "./schema"

const DB_NAME = "recipes.db"

let dbInstance: SQLite.SQLiteDatabase | null = null

/**
 * Opens (or returns the already-open) database connection.
 *
 * Both PRAGMAs below are required for the schema to behave correctly and
 * must be set on EVERY new connection — SQLite does not persist pragma
 * settings inside the database file itself:
 *  - foreign_keys=ON:       without it, ON DELETE CASCADE is silently a no-op
 *  - recursive_triggers=ON: the GC triggers in schema.ts have to fire when a
 *                           junction row is removed by a cascade rather than
 *                           by a direct statement (deleting a recipe cascades
 *                           into component_ingredients, which should then fire
 *                           trg_gc_ingredients_component). Current SQLite
 *                           builds do that regardless of this pragma, but it
 *                           was required historically and expo-sqlite pins its
 *                           own SQLite version, so leave it on.
 */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
	if (dbInstance) return dbInstance

	const db = await SQLite.openDatabaseAsync(DB_NAME)
	await db.execAsync("PRAGMA foreign_keys = ON;")
	await db.execAsync("PRAGMA recursive_triggers = ON;")
	await db.execAsync(SQL_SCHEMA)
	// The GC triggers bracket the migrations rather than living in SQL_SCHEMA:
	// a migration that rebuilds a table can't run while a trigger references
	// it (see the note in schema.ts), so they come down first and go back up
	// against the final migrated shape.
	await db.execAsync(SQL_GC_DROP_TRIGGERS)
	await migrateSchema(db)
	await db.execAsync(SQL_GC_TRIGGERS)
	await sweepOrphans(db)

	dbInstance = db
	return db
}

/**
 * Clears master rows that were orphaned before the GC triggers were wired up.
 * From here on the triggers keep the tables clean as recipes are deleted, so
 * this is a no-op on every launch after the first — hence the count check
 * before writing anything.
 */
async function sweepOrphans(db: SQLite.SQLiteDatabase): Promise<void> {
	const row = await db.getFirstAsync<{ orphans: number }>(`
        SELECT
            (SELECT COUNT(*) FROM ingredients
             WHERE name NOT IN (SELECT ingredient FROM component_ingredients)
               AND name NOT IN (SELECT ingredient FROM recipe_ingredients))
          + (SELECT COUNT(*) FROM equipment
             WHERE name NOT IN (SELECT equipment FROM component_equipment))
          + (SELECT COUNT(*) FROM tags
             WHERE name NOT IN (SELECT tag FROM recipe_tags)) AS orphans;
    `)
	if (!row || row.orphans === 0) return

	await db.execAsync(SQL_GC_SWEEP)
}

/**
 * `CREATE TABLE IF NOT EXISTS` in schema.ts only shapes brand-new databases
 * — it's a no-op against a recipes table that already exists on disk from
 * before a column was added. There's no versioned migration system here, so
 * additive columns are patched in by checking PRAGMA table_info and running
 * ALTER TABLE if missing.
 */
async function migrateSchema(db: SQLite.SQLiteDatabase): Promise<void> {
	const columns = await db.getAllAsync<{ name: string }>(
		"PRAGMA table_info(recipes);"
	)
	const hasDirections = columns.some((c) => c.name === "directions")
	if (!hasDirections) {
		await db.execAsync(
			"ALTER TABLE recipes ADD COLUMN directions TEXT NOT NULL DEFAULT '';"
		)
	}
	const hasPrepTime = columns.some((c) => c.name === "prep_time")
	if (!hasPrepTime) {
		await db.execAsync(
			"ALTER TABLE recipes ADD COLUMN prep_time INTEGER NOT NULL DEFAULT 0;"
		)
	}
	const hasCookTime = columns.some((c) => c.name === "cook_time")
	if (!hasCookTime) {
		await db.execAsync(
			"ALTER TABLE recipes ADD COLUMN cook_time INTEGER NOT NULL DEFAULT 0;"
		)
	}

	await migrateComponentIngredientsKey(db)
	await migrateComponentPosition(db)
}

/**
 * Adds components.position, which records the order the user arranged a
 * recipe's components in.
 *
 * Backfill uses id order, which is the order the components were originally
 * inserted. For any recipe that has been edited since it was created that's
 * also the alphabetical order it has been displaying in (updateRecipe
 * re-inserts the whole tree from a draft that was itself hydrated in index
 * order), so this is a no-op for those and restores the original entry order
 * for the rest.
 */
async function migrateComponentPosition(
	db: SQLite.SQLiteDatabase
): Promise<void> {
	const columns = await db.getAllAsync<{ name: string }>(
		"PRAGMA table_info(components);"
	)
	// An empty result means a brand-new database whose table hasn't been
	// created yet — schema.ts already includes the column.
	if (columns.length === 0) return
	if (columns.some((c) => c.name === "position")) return

	await db.execAsync(
		"ALTER TABLE components ADD COLUMN position INTEGER NOT NULL DEFAULT 0;"
	)
	await db.execAsync(`
        UPDATE components SET position = (
            SELECT COUNT(*) FROM components AS earlier
            WHERE earlier.recipe_id = components.recipe_id
              AND earlier.id < components.id
        );
    `)
}

/**
 * Widens component_ingredients' primary key from (component_id, ingredient)
 * to (component_id, ingredient, prep) so a component can list the same
 * ingredient twice with different prep notes.
 *
 * SQLite can't ALTER a primary key, so this is the standard rebuild dance:
 * create the new-shaped table, copy the rows over, drop the old one, rename.
 * Existing rows are unique on the narrower key, so the copy can never hit a
 * conflict. Foreign keys are switched off around the rebuild — DROP TABLE
 * would otherwise fire the child cascades we're trying to preserve — and the
 * PRAGMA has to sit outside the transaction, which SQLite ignores it inside.
 */
async function migrateComponentIngredientsKey(
	db: SQLite.SQLiteDatabase
): Promise<void> {
	const columns = await db.getAllAsync<{ name: string; pk: number }>(
		"PRAGMA table_info(component_ingredients);"
	)
	// pk is the column's 1-based position in the primary key, or 0 if it
	// isn't part of it. An empty result means a brand-new database whose
	// table hasn't been created yet — nothing to migrate either way.
	if (columns.length === 0) return
	const prepInKey = columns.some((c) => c.name === "prep" && c.pk > 0)
	if (prepInKey) return

	await db.execAsync("PRAGMA foreign_keys = OFF;")
	try {
		await db.withTransactionAsync(async () => {
			await db.execAsync(`
                CREATE TABLE component_ingredients_new (
                    component_id INTEGER NOT NULL REFERENCES components(id) ON DELETE CASCADE,
                    ingredient   TEXT NOT NULL REFERENCES ingredients(name) ON DELETE CASCADE,
                    amount       REAL NOT NULL,
                    unit         TEXT NOT NULL,
                    prep         TEXT NOT NULL,
                    PRIMARY KEY (component_id, ingredient, prep)
                );
                INSERT INTO component_ingredients_new (component_id, ingredient, amount, unit, prep)
                    SELECT component_id, ingredient, amount, unit, prep FROM component_ingredients;
                DROP TABLE component_ingredients;
                ALTER TABLE component_ingredients_new RENAME TO component_ingredients;
            `)
		})
	} finally {
		await db.execAsync("PRAGMA foreign_keys = ON;")
	}
}

/** Test-only escape hatch to force a fresh connection + schema run. */
export function _resetDbForTests(): void {
	dbInstance = null
}
