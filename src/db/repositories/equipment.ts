import * as SQLite from "expo-sqlite"
import { getDb } from "../../db/client"

type Db = SQLite.SQLiteDatabase

/**
 * Adds `name` to the shared equipment master list if it isn't already
 * there. Called from within recipeRepository's write transaction, so it
 * takes the open `db` handle rather than opening its own.
 */
export async function upsertEquipment(db: Db, name: string): Promise<void> {
	await db.runAsync(`INSERT OR IGNORE INTO equipment (name) VALUES (?);`, [
		name
	])
}

/** All known equipment names, for autocomplete in the component form. */
export async function listEquipmentNames(): Promise<string[]> {
	const db = await getDb()
	const rows = await db.getAllAsync<{ name: string }>(
		`SELECT name FROM equipment ORDER BY name COLLATE NOCASE;`
	)
	return rows.map((r) => r.name)
}
