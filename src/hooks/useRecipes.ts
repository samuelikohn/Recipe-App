import { useCallback, useEffect, useState } from "react"
import { getRecipeSummaries } from "../db/repositories/recipes"
import { RecipeSummary } from "../models/types"
import { useDbChangeSignal } from "./useDbChangeSignal"

type UseRecipesResult = {
	recipes: RecipeSummary[]
	loading: boolean
	error: Error | null
	refetch: () => void
}

/**
 * All recipes for the list screen, optionally filtered to those carrying
 * every tag in `tagFilter` (AND semantics — matches the tag-chip-row filter
 * described for RecipeListScreen). Refetches automatically whenever a write
 * happens anywhere else in the app.
 */
export function useRecipes(tagFilter: string[] = []): UseRecipesResult {
	const [recipes, setRecipes] = useState<RecipeSummary[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)
	const changeVersion = useDbChangeSignal()
	const [manualVersion, setManualVersion] = useState(0)

	// Stringify so an inline `[]` or new array literal each render doesn't
	// retrigger the effect — only an actual change in filter contents does.
	const tagFilterKey = JSON.stringify(tagFilter)

	useEffect(() => {
		let cancelled = false
		setLoading(true)

		getRecipeSummaries()
			.then((all) => {
				if (cancelled) return
				const filter: string[] = JSON.parse(tagFilterKey)
				const filtered = filter.length
					? all.filter((r) => filter.every((t) => r.tags.includes(t)))
					: all
				setRecipes(filtered)
				setError(null)
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
	}, [changeVersion, manualVersion, tagFilterKey])

	const refetch = useCallback(() => setManualVersion((v) => v + 1), [])

	return { recipes, loading, error, refetch }
}
