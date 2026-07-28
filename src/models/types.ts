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

export type Ingredient = {
	name: string
	amount: number
	unit: string
	prep: string
}
