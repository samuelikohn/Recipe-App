import * as SQLite from "expo-sqlite"
import { getDb } from "../client"
import { Component, Recipe, RecipeSummary } from "../../models/types"
import { upsertIngredient } from "./ingredients"
import { upsertEquipment } from "./equipment"
import { upsertTag } from "./tags"

type Db = SQLite.SQLiteDatabase

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** Lightweight rows for the recipe list screen — one cover image, no components. */
export async function getRecipeSummaries(): Promise<RecipeSummary[]> {
	const db = await getDb()
	const rows = await db.getAllAsync<{
		id: number
		name: string
		num_servings: number
		coverImage: string | null
		tags: string | null
	}>(
		`SELECT r.id, r.name, r.num_servings,
            (SELECT filepath FROM images WHERE recipe_id = r.id LIMIT 1) AS coverImage,
            (SELECT GROUP_CONCAT(tag, ',') FROM recipe_tags WHERE recipe_id = r.id) AS tags
     FROM recipes r
     ORDER BY r.name COLLATE NOCASE;`
	)

	return rows.map(toSummary)
}

/**
 * Full-text style search across recipe name, tags, and ingredient names.
 * Simple LIKE matching — plenty fast at personal-recipe-box scale. If this
 * ever needs to scale up, an FTS5 virtual table is a drop-in upgrade later.
 */
export async function searchRecipes(query: string): Promise<RecipeSummary[]> {
	const db = await getDb()
	const like = `%${query}%`

	const rows = await db.getAllAsync<{
		id: number
		name: string
		num_servings: number
		coverImage: string | null
		tags: string | null
	}>(
		`SELECT DISTINCT r.id, r.name, r.num_servings,
            (SELECT filepath FROM images WHERE recipe_id = r.id LIMIT 1) AS coverImage,
            (SELECT GROUP_CONCAT(tag, ',') FROM recipe_tags WHERE recipe_id = r.id) AS tags
     FROM recipes r
     LEFT JOIN recipe_tags rt ON rt.recipe_id = r.id
     LEFT JOIN components c ON c.recipe_id = r.id
     LEFT JOIN component_ingredients ci ON ci.component_id = c.id
     WHERE r.name LIKE ? OR rt.tag LIKE ? OR ci.ingredient LIKE ?
     ORDER BY r.name COLLATE NOCASE;`,
		[like, like, like]
	)

	return rows.map(toSummary)
}

/** Fully hydrated recipe (images, components, ingredients, equipment, tags) by name. */
export async function getRecipeByName(name: string): Promise<Recipe | null> {
	const db = await getDb()

	const recipeRow = await db.getFirstAsync<{
		id: number
		name: string
		num_servings: number
	}>(`SELECT id, name, num_servings FROM recipes WHERE name = ?;`, [name])
	if (!recipeRow) return null

	return hydrateRecipe(db, recipeRow)
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/** Creates a new recipe with its full component/ingredient/equipment/tag tree in one transaction. */
export async function createRecipe(recipe: Recipe): Promise<number> {
	const db = await getDb()
	let recipeId!: number

	await db.withTransactionAsync(async () => {
		recipeId = await insertRecipeTree(db, recipe)
	})

	return recipeId
}

/**
 * Replaces an existing recipe's contents with `recipe`, matched by its
 * current name.
 *
 * Implementation: delete the recipe row (cascades away every child row, and
 * the GC triggers clean up any now-unused ingredients/equipment/tags), then
 * re-insert the full tree fresh. This is simpler than diffing field-by-field
 * and just as safe, since the form always submits a recipe's entire tree as
 * one unit. Because children key off recipe_id rather than name, this also
 * means renaming a recipe "for free" — no separate rename step needed.
 *
 * Note the recipe's surrogate id changes on every edit as a result. That's
 * fine here since screens navigate by name (see RecipeDetail(name) in the
 * navigation map), not by id — nothing holds onto a stale id across an edit.
 */
export async function updateRecipe(
	currentName: string,
	recipe: Recipe
): Promise<number> {
	const db = await getDb()
	let recipeId!: number

	await db.withTransactionAsync(async () => {
		const existing = await db.getFirstAsync<{ id: number }>(
			`SELECT id FROM recipes WHERE name = ?;`,
			[currentName]
		)
		if (!existing) {
			throw new Error(
				`updateRecipe: no recipe named "${currentName}" exists.`
			)
		}

		await db.runAsync(`DELETE FROM recipes WHERE name = ?;`, [currentName])
		recipeId = await insertRecipeTree(db, recipe)
	})

	return recipeId
}

/**
 * Deletes a recipe. Cascades to images/components/recipe_tags, which in
 * turn cascades to component_ingredients/component_equipment; the GC
 * triggers on those junction tables clean up any now-orphaned
 * ingredients/equipment/tags automatically. No app-level cleanup needed.
 *
 * Image *files* on disk are not touched by this — that's a filesystem
 * concern, not a database one. Call fileStorage's cleanup alongside this
 * (see the architecture doc, §7) before or after this delete.
 */
export async function deleteRecipe(name: string): Promise<void> {
	const db = await getDb()
	await db.runAsync(`DELETE FROM recipes WHERE name = ?;`, [name])
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function toSummary(row: {
	id: number
	name: string
	num_servings: number
	coverImage: string | null
	tags: string | null
}): RecipeSummary {
	return {
		name: row.name,
		num_servings: row.num_servings,
		coverImage: row.coverImage,
		tags: row.tags ? row.tags.split(",") : []
	}
}

async function hydrateRecipe(
	db: Db,
	recipeRow: { id: number; name: string; num_servings: number }
): Promise<Recipe> {
	const images = await db.getAllAsync<{ filepath: string }>(
		`SELECT filepath FROM images WHERE recipe_id = ?;`,
		[recipeRow.id]
	)

	const tags = await db.getAllAsync<{ tag: string }>(
		`SELECT tag FROM recipe_tags WHERE recipe_id = ?;`,
		[recipeRow.id]
	)

	const componentRows = await db.getAllAsync<{
		id: number
		name: string
		directions: string
		prep_time: number
		cook_time: number
	}>(
		`SELECT id, name, directions, prep_time, cook_time FROM components WHERE recipe_id = ?;`,
		[recipeRow.id]
	)

	const components: Component[] = []
	for (const c of componentRows) {
		const ingredientRows = await db.getAllAsync<{
			ingredient: string
			amount: number
			unit: string
			prep: string
		}>(
			`SELECT ingredient, amount, unit, prep FROM component_ingredients WHERE component_id = ?;`,
			[c.id]
		)

		const equipmentRows = await db.getAllAsync<{ equipment: string }>(
			`SELECT equipment FROM component_equipment WHERE component_id = ?;`,
			[c.id]
		)

		components.push({
			id: c.id,
			name: c.name,
			directions: c.directions,
			prep_time: c.prep_time,
			cook_time: c.cook_time,
			ingredients: ingredientRows.map((i) => ({
				name: i.ingredient,
				amount: i.amount,
				unit: i.unit,
				prep: i.prep
			})),
			equipment: equipmentRows.map((e) => e.equipment)
		})
	}

	return {
		id: recipeRow.id,
		name: recipeRow.name,
		num_servings: recipeRow.num_servings,
		images: images.map((i) => i.filepath),
		components,
		tags: tags.map((t) => t.tag)
	}
}

async function insertRecipeTree(db: Db, recipe: Recipe): Promise<number> {
	const recipeResult = await db.runAsync(
		`INSERT INTO recipes (name, num_servings) VALUES (?, ?);`,
		[recipe.name, recipe.num_servings]
	)
	const recipeId = recipeResult.lastInsertRowId

	for (const filepath of recipe.images) {
		await db.runAsync(
			`INSERT INTO images (filepath, recipe_id) VALUES (?, ?);`,
			[filepath, recipeId]
		)
	}

	for (const tag of recipe.tags) {
		await upsertTag(db, tag)
		await db.runAsync(
			`INSERT INTO recipe_tags (recipe_id, tag) VALUES (?, ?);`,
			[recipeId, tag]
		)
	}

	for (const component of recipe.components) {
		const componentResult = await db.runAsync(
			`INSERT INTO components (recipe_id, name, directions, prep_time, cook_time) VALUES (?, ?, ?, ?, ?);`,
			[
				recipeId,
				component.name,
				component.directions,
				component.prep_time,
				component.cook_time
			]
		)
		const componentId = componentResult.lastInsertRowId

		for (const ingredient of component.ingredients) {
			await upsertIngredient(db, ingredient.name)
			await db.runAsync(
				`INSERT INTO component_ingredients (component_id, ingredient, amount, unit, prep) VALUES (?, ?, ?, ?, ?);`,
				[
					componentId,
					ingredient.name,
					ingredient.amount,
					ingredient.unit,
					ingredient.prep
				]
			)
		}

		for (const equipmentName of component.equipment) {
			await upsertEquipment(db, equipmentName)
			await db.runAsync(
				`INSERT INTO component_equipment (component_id, equipment) VALUES (?, ?);`,
				[componentId, equipmentName]
			)
		}
	}

	return recipeId
}
