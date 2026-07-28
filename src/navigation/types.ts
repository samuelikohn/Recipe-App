import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Component, Recipe } from "../models/types"

/**
 * Navigation param list for the root native-stack navigator.
 *
 * Recipes are addressed by `name` rather than surrogate id: names are unique
 * (see UNIQUE constraint on recipes.name) and stable across edits, whereas
 * recipes.id changes on every update (see updateRecipe in
 * db/repositories/recipes.ts).
 *
 * ComponentForm is opened as a modal-style child of RecipeForm and receives
 * the current draft plus an index into the parent's component array (or -1
 * when adding a new one). It communicates its result back via a route
 * `onSubmit` callback param — the parent screen keeps the draft recipe in
 * its own state until the user hits save on RecipeForm itself.
 */
export type RootStackParamList = {
	RecipeList: undefined
	RecipeDetail: { name: string }
	RecipeForm: { name?: string }
	ComponentForm: {
		initial: Component | null
		onSubmit: (component: Component) => void
	}
	Search: undefined
}

export type ScreenProps<T extends keyof RootStackParamList> =
	NativeStackScreenProps<RootStackParamList, T>

/**
 * Shape passed around inside RecipeFormScreen while the user is still
 * editing. Identical to Recipe but with `id` optional so we can represent a
 * not-yet-persisted draft.
 */
export type RecipeDraft = Omit<Recipe, "id"> & { id?: number }
