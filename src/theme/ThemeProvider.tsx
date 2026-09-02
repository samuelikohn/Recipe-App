import { createContext, ReactNode, useContext } from "react"
import { StyleSheet, useColorScheme } from "react-native"
import { StatusBar } from "expo-status-bar"
import { usePreferences } from "../hooks/PreferencesProvider"
import { palettes, ThemeColors, ThemeMode } from "./colors"

type ThemeContextValue = {
	/** What the user asked for. "system" means "whatever the OS says". */
	mode: ThemeMode
	/** The palette that `mode` actually resolves to right now. */
	colors: ThemeColors
	isDark: boolean
	setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/**
 * Resolves the stored theme preference into a live palette.
 *
 * Mount this ABOVE DatabaseProvider in the tree — DatabaseProvider's own
 * loading/error screens are themed, so the palette has to exist before it
 * renders — and BELOW PreferencesProvider, which is where the mode is loaded
 * from and written back to.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
	const systemScheme = useColorScheme()
	const { preferences, setPreference } = usePreferences()
	const mode = preferences.themeMode

	function setMode(next: ThemeMode) {
		setPreference("themeMode", next)
	}

	// useColorScheme returns null when the OS scheme is unknown; treat that as
	// light, matching the palette the app shipped with.
	const isDark = mode === "system" ? systemScheme === "dark" : mode === "dark"

	return (
		<ThemeContext.Provider
			value={{
				mode,
				colors: isDark ? palettes.dark : palettes.light,
				isDark,
				setMode
			}}
		>
			{children}
		</ThemeContext.Provider>
	)
}

/** Active palette plus the controls for changing it. */
export function useTheme(): ThemeContextValue {
	const value = useContext(ThemeContext)
	if (!value) {
		throw new Error("useTheme must be used inside a ThemeProvider")
	}
	return value
}

type StyleFactory<T> = (colors: ThemeColors) => T

// Two-level cache: factory -> palette -> the StyleSheet it produced. Style
// factories are module-level constants and there are only ever two palettes,
// so every component instance after the first shares one registered
// StyleSheet per theme instead of re-creating it on each render. Both levels
// are weak so an unmounted screen's factory can still be collected.
const styleCache = new WeakMap<
	StyleFactory<unknown>,
	WeakMap<ThemeColors, unknown>
>()

/**
 * Theme-aware replacement for a module-level `StyleSheet.create`. Define the
 * sheet as a factory outside the component and call this inside it:
 *
 *   const makeStyles = (colors: ThemeColors) =>
 *     StyleSheet.create({ card: { backgroundColor: colors.surface } })
 *
 *   function Card() {
 *     const styles = useThemedStyles(makeStyles)
 *     ...
 *   }
 *
 * The factory must be a stable reference — an inline arrow defeats the cache
 * and rebuilds the sheet on every render.
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
	factory: StyleFactory<T>
): T {
	const { colors } = useTheme()

	let byPalette = styleCache.get(factory as StyleFactory<unknown>)
	if (!byPalette) {
		byPalette = new WeakMap()
		styleCache.set(factory as StyleFactory<unknown>, byPalette)
	}
	let styles = byPalette.get(colors) as T | undefined
	if (!styles) {
		styles = factory(colors)
		byPalette.set(colors, styles)
	}
	return styles
}

/**
 * expo-status-bar's `style="auto"` keys off the navigation background, which
 * it can't see here, so the status bar content is driven off the theme
 * directly: light glyphs on the dark palette, dark glyphs on the light one.
 */
export function ThemedStatusBar() {
	const { isDark } = useTheme()
	return <StatusBar style={isDark ? "light" : "dark"} />
}
