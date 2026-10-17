import { createContext, ReactNode, useContext } from "react"
import { StyleSheet, TextStyle, useColorScheme } from "react-native"
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
	/** User's text-size multiplier, already applied by useThemedStyles. */
	fontScale: number
	setFontScale: (scale: number) => void
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

	function setFontScale(next: number) {
		setPreference("fontScale", next)
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
				setMode,
				fontScale: preferences.fontScale,
				setFontScale
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

type StyleFactory<T> = (colors: ThemeColors, fontScale: number) => T

// Three-level cache: factory -> palette -> font scale -> the StyleSheet it
// produced. Style factories are module-level constants, there are only ever
// two palettes, and the font scale moves in fixed steps, so every component
// instance after the first shares one StyleSheet per (theme, scale) instead of
// re-creating it on each render. The outer levels are weak so an unmounted
// screen's factory can still be collected; the scale level is a plain Map
// since its keys are numbers and there are at most a dozen or so of them.
const styleCache = new WeakMap<
	StyleFactory<unknown>,
	WeakMap<ThemeColors, Map<number, unknown>>
>()

/**
 * Multiplies every numeric fontSize/lineHeight in a sheet by `scale`. Rounded
 * to the half point so text doesn't land on awkward subpixel sizes.
 */
function scaleFonts<T extends StyleSheet.NamedStyles<T>>(
	sheet: T,
	scale: number
): T {
	if (scale === 1) return sheet

	const round = (n: number) => Math.round(n * scale * 2) / 2
	const scaled: Record<string, TextStyle> = {}
	for (const [name, style] of Object.entries(sheet as object) as [
		string,
		TextStyle
	][]) {
		const next = { ...style }
		if (typeof next.fontSize === "number") {
			next.fontSize = round(next.fontSize)
		}
		if (typeof next.lineHeight === "number") {
			next.lineHeight = round(next.lineHeight)
		}
		scaled[name] = next
	}
	return scaled as T
}

/**
 * Theme-aware replacement for a module-level `StyleSheet.create`. Define the
 * sheet as a factory outside the component and call this inside it:
 *
 *   const makeStyles = (colors: ThemeColors, fontScale: number) =>
 *     StyleSheet.create({ card: { backgroundColor: colors.surface } })
 *
 *   function Card() {
 *     const styles = useThemedStyles(makeStyles)
 *     ...
 *   }
 *
 * The factory must be a stable reference — an inline arrow defeats the cache
 * and rebuilds the sheet on every render.
 *
 * This is also where the user's "Text size" preference takes effect: every
 * fontSize/lineHeight the factory returns is multiplied by the current font
 * scale. Factories can also use `fontScale` for dimensions that wrap text or
 * text-like icons, such as a chip's padding or an icon button's diameter.
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
	factory: StyleFactory<T>
): T {
	const { colors, fontScale } = useTheme()

	let byPalette = styleCache.get(factory as StyleFactory<unknown>)
	if (!byPalette) {
		byPalette = new WeakMap()
		styleCache.set(factory as StyleFactory<unknown>, byPalette)
	}
	let byScale = byPalette.get(colors)
	if (!byScale) {
		byScale = new Map()
		byPalette.set(colors, byScale)
	}
	let styles = byScale.get(fontScale) as T | undefined
	if (!styles) {
		styles = scaleFonts(factory(colors, fontScale), fontScale)
		byScale.set(fontScale, styles)
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
