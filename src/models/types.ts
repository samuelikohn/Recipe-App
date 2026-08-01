export type RecipeSummary = {
	name: string
	num_servings: number
	coverImage: string | null
	tags: string[]
}

export type Recipe = {
	id: number
	name: string
	num_servings: number
	directions: string
	prep_time: number
	cook_time: number
	ingredients: Ingredient[]
	images: string[]
	components: Component[]
	tags: string[]
}

export type Component = {
	id: number
	name: string
	directions: string
	prep_time: number
	cook_time: number
	ingredients: Ingredient[]
	equipment: string[]
}

/**
 * One ingredient line within a Component. A component may list the same
 * `name` several times as long as each entry has a different `prep` — an
 * ingredient's identity within a component is the (name, prep) pair, not the
 * name alone. Use `ingredientKey` wherever a stable per-line identifier is
 * needed (React keys, dedup checks) rather than reaching for `name`.
 */
export type Ingredient = {
	name: string
	amount: number
	unit: string
	prep: string
}

/** Identity of an ingredient line within its component: name + prep, case-insensitive. */
export function ingredientKey(ingredient: Ingredient): string {
	return `${ingredient.name.trim().toLowerCase()}|${ingredient.prep.trim().toLowerCase()}`
}
