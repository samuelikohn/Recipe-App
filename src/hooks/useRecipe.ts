import { useCallback, useEffect, useState } from "react"
import { getRecipeByName } from "../db/repositories/recipes"
import { Recipe } from "../models/types"
import { useDbChangeSignal } from "./useDbChangeSignal"

type UseRecipeResult = {
	recipe: Recipe | null
	loading: boolean
	error: Error | null
	refetch: () => void
}

/**
 * A single fully-hydrated recipe by name, for RecipeDetailScreen and
 * RecipeFormScreen (edit mode). `name` may be undefined while navigation
 * params are still settling — the hook just reports not-loading with a
 * null recipe rather than erroring.
 */
export function useRecipe(name: string | undefined): UseRecipeResult {
	const [recipe, setRecipe] = useState<Recipe | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)
	const changeVersion = useDbChangeSignal()
	const [manualVersion, setManualVersion] = useState(0)

	useEffect(() => {
		if (!name) {
			setRecipe(null)
			setLoading(false)
			return
		}

		let cancelled = false
		setLoading(true)

		getRecipeByName(name)
			.then((result) => {
				if (!cancelled) {
					setRecipe(result)
					setError(null)
				}
			})
			.catch((err) => {
				if (!cancelled)
					setError(
						err instanceof Error ? err : new Error(String(err))
					)
			})
			.finally(() => {
				if (!cancelled) setLoading(false)
			})

		return () => {
			cancelled = true
		}
	}, [name, changeVersion, manualVersion])

	const refetch = useCallback(() => setManualVersion((v) => v + 1), [])

	return { recipe, loading, error, refetch }
}
