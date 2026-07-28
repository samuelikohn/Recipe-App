import { useEffect, useState } from "react"
import { searchRecipes } from "../db/repositories/recipes"
import { RecipeSummary } from "../models/types"
import { useDbChangeSignal } from "./useDbChangeSignal"

const DEBOUNCE_MS = 300

type UseSearchResult = {
	query: string
	setQuery: (query: string) => void
	results: RecipeSummary[]
	loading: boolean
	error: Error | null
}

/**
 * Debounced recipe search across name, tags, and ingredient names (see
 * recipeRepository.searchRecipes). Returns an empty result set — not "all
 * recipes" — for an empty query, so SearchScreen can show its own empty
 * state rather than the full list.
 */
export function useSearch(): UseSearchResult {
	const [query, setQuery] = useState("")
	const [debouncedQuery, setDebouncedQuery] = useState("")
	const [results, setResults] = useState<RecipeSummary[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)
	const changeVersion = useDbChangeSignal()

	useEffect(() => {
		const timeout = setTimeout(
			() => setDebouncedQuery(query.trim()),
			DEBOUNCE_MS
		)
		return () => clearTimeout(timeout)
	}, [query])

	useEffect(() => {
		if (!debouncedQuery) {
			setResults([])
			setLoading(false)
			setError(null)
			return
		}

		let cancelled = false
		setLoading(true)

		searchRecipes(debouncedQuery)
			.then((found) => {
				if (!cancelled) {
					setResults(found)
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
	}, [debouncedQuery, changeVersion])

	return { query, setQuery, results, loading, error }
}
