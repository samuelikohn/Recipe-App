import * as SQLite from "expo-sqlite"
import { getDb } from "../../db/client"

type Db = SQLite.SQLiteDatabase

/**
 * Adds `name` to the shared ingredient master list if it isn't already
 * there. Called from within recipeRepository's write transaction, so it
 * takes the open `db` handle rather than opening its own.
 */
export async function upsertIngredient(db: Db, name: string): Promise<void> {
	await db.runAsync(`INSERT OR IGNORE INTO ingredients (name) VALUES (?);`, [
		name
	])
}

/** All known ingredient names, for autocomplete in the component form. */
export async function listIngredientNames(): Promise<string[]> {
	const db = await getDb()
	const rows = await db.getAllAsync<{ name: string }>(
		`SELECT name FROM ingredients ORDER BY name COLLATE NOCASE;`
	)
	return rows.map((r) => r.name)
}
