import { Component, Recipe, ingredientKey } from "../models/types"

/**
 * `{ ok: true }` on success, `{ ok: false, message }` on the first
 * violated rule. Returning only the first failure keeps the caller simple:
 * RecipeFormScreen / ComponentFormScreen show one clear Alert() rather
 * than a bulleted list. Fields are validated as-is; trimming or dedup is
 * the caller's job before calling these.
 */
export type ValidationResult = { ok: true } | { ok: false; message: string }

/**
 * Rules a Recipe draft must satisfy before RecipeFormScreen persists it.
 * Recurses into each Component so the form's single Save button can
 * surface component-level problems too.
 */
export function validateRecipe(
	recipe: Pick<Recipe, "name" | "num_servings" | "components">
): ValidationResult {
	if (recipe.name.trim().length === 0) {
		return { ok: false, message: "Name is required" }
	}
	if (!Number.isFinite(recipe.num_servings) || recipe.num_servings < 1) {
		return { ok: false, message: "Servings must be at least 1" }
	}
	for (let i = 0; i < recipe.components.length; i++) {
		const check = validateComponent(recipe.components[i])
		if (!check.ok) {
			return {
				ok: false,
				message: `Component ${i + 1}: ${check.message}`
			}
		}
	}
	return { ok: true }
}

/**
 * Rules a Component draft must satisfy on Done from ComponentFormScreen.
 * Ingredients with a blank name are ignored — they're just empty rows the
 * user added and didn't fill in, and the form filters them out on submit.
 *
 * Repeating an ingredient is allowed as long as the prep differs (see the
 * Ingredient docs); repeating it with the same prep is not, since the two
 * lines belong together as one amount and the database key would reject it.
 */
export function validateComponent(
	component: Pick<
		Component,
		"name" | "prep_time" | "cook_time" | "ingredients"
	>
): ValidationResult {
	if (component.name.trim().length === 0) {
		return { ok: false, message: "Component name is required" }
	}
	if (component.prep_time < 0 || component.cook_time < 0) {
		return { ok: false, message: "Times cannot be negative" }
	}
	const seen = new Set<string>()
	for (const ingredient of component.ingredients) {
		if (ingredient.name.trim().length === 0) continue
		if (!Number.isFinite(ingredient.amount) || ingredient.amount < 0) {
			return {
				ok: false,
				message: `Ingredient "${ingredient.name}" has an invalid amount`
			}
		}
		const key = ingredientKey(ingredient)
		if (seen.has(key)) {
			return {
				ok: false,
				message: ingredient.prep.trim()
					? `Ingredient "${ingredient.name}" is listed twice with the same prep ("${ingredient.prep.trim()}") — combine them or give them different prep`
					: `Ingredient "${ingredient.name}" is listed twice — combine them or give them different prep`
			}
		}
		seen.add(key)
	}
	return { ok: true }
}
