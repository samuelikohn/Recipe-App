import {
	createContext,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState
} from "react"
import { getAllSettings, setSetting } from "../db/repositories/settings"
import { ThemeMode } from "../theme/colors"
import { FONT_SCALE_MAX, FONT_SCALE_MIN } from "../theme/typography"

/**
 * Every user-facing preference the settings screen can change. Add a field
 * here, a storage key in KEYS, a default in DEFAULTS, and a line in hydrate()
 * — nothing else needs to know the setting exists.
 */
export type Preferences = {
	/** Light/dark palette choice. Read through useTheme, not directly. */
	themeMode: ThemeMode
	/** Whether list screens put a result count in their header title. */
	showRecipeCount: boolean
	/** Multiplier applied to every font size; 1 = design size. Read through useTheme. */
	fontScale: number
	/* Whether to show the copy icon on recipe components */
	showComponentCopy: boolean
}

/**
 * Column values in the settings table. These are persisted, so renaming one
 * silently resets that preference for existing users.
 */
const KEYS = {
	themeMode: "theme_mode",
	showRecipeCount: "show_recipe_count",
	fontScale: "font_scale",
	showComponentCopy: "show_copy_component"
} as const satisfies Record<keyof Preferences, string>

const DEFAULTS: Preferences = {
	themeMode: "system",
	showRecipeCount: true,
	fontScale: 1,
	showComponentCopy: false
}

type PreferencesContextValue = {
	preferences: Preferences
	setPreference: <K extends keyof Preferences>(
		key: K,
		value: Preferences[K]
	) => void
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

function isThemeMode(value: string | undefined): value is ThemeMode {
	return value === "light" || value === "dark" || value === "system"
}

/**
 * Turns raw settings rows into a Preferences object, falling back to the
 * default for anything missing or unrecognized. Values are written with
 * String(), so parsing is per-key rather than a shared codec.
 */
function hydrate(rows: Record<string, string>): Preferences {
	const storedTheme = rows[KEYS.themeMode]
	const storedCount = rows[KEYS.showRecipeCount]
	const storedScale = Number(rows[KEYS.fontScale])
	const storedCopy = rows[KEYS.showComponentCopy]

	return {
		fontScale: Number.isFinite(storedScale)
			? Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, storedScale))
			: DEFAULTS.fontScale,
		themeMode: isThemeMode(storedTheme) ? storedTheme : DEFAULTS.themeMode,
		showRecipeCount:
			storedCount === undefined
				? DEFAULTS.showRecipeCount
				: storedCount === "true",
		showComponentCopy:
			storedCopy === undefined
				? DEFAULTS.showComponentCopy
				: storedCopy === "false"
	}
}

/**
 * Loads the persisted preferences once at startup and holds them for the
 * app.
 *
 * Mount this outermost of the data providers — ThemeProvider reads its mode
 * from here, so it has to be above that, which puts it above DatabaseProvider
 * too. It calls getDb() as it mounts, same as DatabaseProvider; that's safe
 * because getDb caches its in-flight promise (see db/client.ts).
 *
 * Children are held back until the read finishes. The wait is the DB open,
 * which DatabaseProvider is blocking on anyway, and it means screens never
 * render once against defaults and then again against the real values — which
 * for the theme would be a visible light-to-dark flash.
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
	const [preferences, setPreferences] = useState<Preferences>(DEFAULTS)
	const [loaded, setLoaded] = useState(false)

	useEffect(() => {
		let cancelled = false

		getAllSettings()
			.then((rows) => {
				if (!cancelled) setPreferences(hydrate(rows))
			})
			// Preferences we can't read aren't worth blocking the app over —
			// fall through to the defaults. DatabaseProvider surfaces the error
			// if the database itself is the problem.
			.catch(() => {})
			.finally(() => {
				if (!cancelled) setLoaded(true)
			})

		return () => {
			cancelled = true
		}
	}, [])

	const setPreference = useCallback(
		<K extends keyof Preferences>(key: K, value: Preferences[K]) => {
			// Applied optimistically: a toggle should feel instant, and a failed
			// write costs the user the preference on next launch, not this one.
			setPreferences((current) => ({ ...current, [key]: value }))
			setSetting(KEYS[key], String(value)).catch(() => {})
		},
		[]
	)

	if (!loaded) return null

	return (
		<PreferencesContext.Provider value={{ preferences, setPreference }}>
			{children}
		</PreferencesContext.Provider>
	)
}

/** The persisted preferences plus the setter that writes them back. */
export function usePreferences(): PreferencesContextValue {
	const value = useContext(PreferencesContext)
	if (!value) {
		throw new Error(
			"usePreferences must be used inside a PreferencesProvider"
		)
	}
	return value
}
