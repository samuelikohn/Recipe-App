import * as SQLite from "expo-sqlite"
import { SQL_SCHEMA } from "./schema"

const DB_NAME = "recipes.db"

let dbInstance: SQLite.SQLiteDatabase | null = null

/**
 * Opens (or returns the already-open) database connection.
 *
 * Both PRAGMAs below are required for the schema to behave correctly and
 * must be set on EVERY new connection — SQLite does not persist pragma
 * settings inside the database file itself:
 *  - foreign_keys=ON:       without it, ON DELETE CASCADE is silently a no-op
 *  - recursive_triggers=ON: without it, the GC triggers in schema.ts won't
 *                           fire when a delete happens via cascade rather
 *                           than a direct statement against that table
 *                           (e.g. deleting a recipe cascades into
 *                           component_ingredients, which should then fire
 *                           trg_gc_ingredients)
 */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
	if (dbInstance) return dbInstance

	const db = await SQLite.openDatabaseAsync(DB_NAME)
	await db.execAsync("PRAGMA foreign_keys = ON;")
	await db.execAsync("PRAGMA recursive_triggers = ON;")
	await db.execAsync(SQL_SCHEMA)
	await migrateSchema(db)

	dbInstance = db
	return db
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

	await migrateComponentIngredientsKey(db)
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
