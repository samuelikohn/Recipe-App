import { getDb } from "../client"
import { Component } from "../../models/types"

/**
 * Fetches a single persisted component (with its ingredients/equipment) by
 * id. Components are otherwise always read/written as part of a full
 * Recipe tree (see recipeRepository) — this exists for the case where
 * ComponentFormScreen is opened to edit a component that's already in the
 * database (e.g. navigated to directly, rather than mid-draft from
 * RecipeFormScreen where the component data already lives in memory).
 */
export async function getComponentById(id: number): Promise<Component | null> {
	const db = await getDb()

	const row = await db.getFirstAsync<{
		id: number
		name: string
		directions: string
		prep_time: number
		cook_time: number
	}>(
		`SELECT id, name, directions, prep_time, cook_time FROM components WHERE id = ?;`,
		[id]
	)
	if (!row) return null

	const ingredientRows = await db.getAllAsync<{
		ingredient: string
		amount: number
		unit: string
		prep: string
	}>(
		// rowid order == the order the user arranged the lines in the form,
		// which is the only thing distinguishing two entries for the same
		// ingredient beyond their prep.
		`SELECT ingredient, amount, unit, prep FROM component_ingredients WHERE component_id = ? ORDER BY rowid;`,
		[id]
	)

	const equipmentRows = await db.getAllAsync<{ equipment: string }>(
		`SELECT equipment FROM component_equipment WHERE component_id = ?;`,
		[id]
	)

	return {
		id: row.id,
		name: row.name,
		directions: row.directions,
		prep_time: row.prep_time,
		cook_time: row.cook_time,
		ingredients: ingredientRows.map((i) => ({
			name: i.ingredient,
			amount: i.amount,
			unit: i.unit,
			prep: i.prep
		})),
		equipment: equipmentRows.map((e) => e.equipment)
	}
}
