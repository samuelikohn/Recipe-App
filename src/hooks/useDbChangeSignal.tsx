import { useEffect, useState } from "react"
import { subscribe } from "../db/changeEmitter"

/**
 * Returns a number that increments every time a write (create/update/
 * delete) happens anywhere in the app. Use it as a useEffect dependency to
 * refetch data after something elsewhere invalidates what's on screen —
 * e.g. RecipeListScreen refreshing after RecipeFormScreen saves.
 */
export function useDbChangeSignal(): number {
	const [version, setVersion] = useState(0)

	useEffect(() => {
		return subscribe(() => setVersion((v) => v + 1))
	}, [])

	return version
}
