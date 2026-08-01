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
}

/** Test-only escape hatch to force a fresh connection + schema run. */
export function _resetDbForTests(): void {
	dbInstance = null
}
