import { getDb } from "../../db/client"

/**
 * Reads one preference out of the settings key/value table.
 * Returns null when the key has never been written, which callers use to
 * mean "no explicit choice yet" and fall back to their own default.
 */
export async function getSetting(key: string): Promise<string | null> {
	const db = await getDb()
	const row = await db.getFirstAsync<{ value: string }>(
		`SELECT value FROM settings WHERE key = ?;`,
		[key]
	)
	return row?.value ?? null
}

/** Writes (or overwrites) one preference. */
export async function setSetting(key: string, value: string): Promise<void> {
	const db = await getDb()
	await db.runAsync(
		`INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
		[key, value]
	)
}
