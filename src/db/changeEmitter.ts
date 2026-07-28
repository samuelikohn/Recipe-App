type Listener = () => void

const listeners = new Set<Listener>()

/**
 * Minimal pub/sub so hooks can refetch after a write happens somewhere else
 * in the app (e.g. RecipeFormScreen saves a recipe, RecipeListScreen needs
 * to know to refresh). Deliberately not React context — nothing here needs
 * to force a re-render on its own; each hook manages its own state and just
 * asks to be notified when something changed.
 */
export function notifyChange(): void {
	listeners.forEach((listener) => listener())
}

/** Registers a listener, returns an unsubscribe function. */
export function subscribe(listener: Listener): () => void {
	listeners.add(listener)
	return () => listeners.delete(listener)
}
