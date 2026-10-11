import { Component, Ingredient, Recipe } from "../models/types"
import { splitDirectionSteps } from "./directions"
import { formatAmount, formatDuration } from "./format"

/**
 * Plain-text rendering of a recipe for "Copy as text" on RecipeDetail.
 * Mirrors what that screen shows — same sections, same skip-when-empty
 * rules, amounts scaled to the servings currently selected — minus images,
 * which have no text form.
 */
export function formatRecipeAsText(recipe: Recipe, servings: number): string {
	const multiplier = servings / recipe.num_servings
	const prepTime = recipe.components.reduce((sum, c) => sum + c.prep_time, 0)
	const cookTime = recipe.components.reduce((sum, c) => sum + c.cook_time, 0)

	const header = [recipe.name, `Servings: ${servings}`]
	if (recipe.tags.length > 0) {
		header.push(`Tags: ${recipe.tags.join(", ")}`)
	}
	const timing = formatTiming(prepTime, cookTime)
	if (timing) {
		header.push(timing)
	}

	const blocks = [
		header.join("\n"),
		...recipe.components.map((c) => formatComponent(c, multiplier))
	]
	return blocks.join("\n\n")
}

function formatComponent(component: Component, multiplier: number): string {
	const blocks: string[] = []

	const header = [component.name]
	const timing = formatTiming(component.prep_time, component.cook_time)
	if (timing) {
		header.push(timing)
	}
	blocks.push(header.join("\n"))

	if (component.equipment.length > 0) {
		blocks.push(
			["Equipment:", ...component.equipment.map((e) => `- ${e}`)].join(
				"\n"
			)
		)
	}

	if (component.ingredients.length > 0) {
		blocks.push(
			[
				"Ingredients:",
				...component.ingredients.map(
					(i) => `- ${formatIngredient(i, multiplier)}`
				)
			].join("\n")
		)
	}

	// Same trim/drop-blank rule as DirectionsList, so step numbers match
	// what's on screen.
	const steps = splitDirectionSteps(component.directions)
		.map((step) => step.trim())
		.filter((step) => step.length > 0)
	if (steps.length > 0) {
		blocks.push(
			[
				"Directions:",
				...steps.map((step, index) => `${index + 1}. ${step}`)
			].join("\n")
		)
	}

	return blocks.join("\n\n")
}

/** Same layout as IngredientRow: "<amount> <unit> <name>, <prep>". */
function formatIngredient(ingredient: Ingredient, multiplier: number): string {
	const amount = formatAmount(ingredient.amount * multiplier)
	const prep = ingredient.prep ? `, ${ingredient.prep}` : ""
	return [amount, ingredient.unit, ingredient.name + prep]
		.filter((part) => part.length > 0)
		.join(" ")
}

function formatTiming(prepTime: number, cookTime: number): string | null {
	const totalTime = prepTime + cookTime
	if (totalTime <= 0) {
		return null
	}
	return `Prep ${formatDuration(prepTime)} · Cook ${formatDuration(cookTime)} · Total ${formatDuration(totalTime)}`
}
