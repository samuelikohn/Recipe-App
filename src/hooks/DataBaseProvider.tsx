import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	ReactNode
} from "react"
import { getDb } from "../db/client"

type DatabaseContextValue = {
	isReady: boolean
	error: Error | null
}

const DatabaseContext = createContext<DatabaseContextValue>({
	isReady: false,
	error: null
})

/**
 * Opens the DB connection (and runs the pragmas + schema) once at app
 * startup, and holds `children` back until it's ready. Wrap the navigation
 * root in this — e.g. in App.tsx:
 *
 *   <DatabaseProvider>
 *     <RootNavigator />
 *   </DatabaseProvider>
 *
 * Screens don't need to read from this context directly for data (the
 * repository functions open their own connection via getDb() internally,
 * which is a cached singleton) — this exists purely to avoid rendering
 * screens before the schema has finished running.
 */
export function DatabaseProvider({ children }: { children: ReactNode }) {
	const [isReady, setIsReady] = useState(false)
	const [error, setError] = useState<Error | null>(null)

	useEffect(() => {
		let cancelled = false

		getDb()
			.then(() => {
				if (!cancelled) setIsReady(true)
			})
			.catch((err) => {
				if (!cancelled)
					setError(
						err instanceof Error ? err : new Error(String(err))
					)
			})

		return () => {
			cancelled = true
		}
	}, [])

	return (
		<DatabaseContext.Provider value={{ isReady, error }}>
			{children}
		</DatabaseContext.Provider>
	)
}

/** Lets a screen show a spinner/error state instead of rendering before the DB is ready. */
export function useDatabaseReady(): DatabaseContextValue {
	return useContext(DatabaseContext)
}
