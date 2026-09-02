/**
 * Semantic color tokens for the app. Values are the literals that were
 * inlined across components/screens during initial build — centralized
 * here so palette tweaks happen in one place. Callers should import these
 * by role, not by hex.
 *
 * There are two palettes with identical token sets. Nothing imports either
 * one directly: components read the active palette from ThemeProvider (via
 * `useTheme`/`useThemedStyles`) so a theme switch re-renders them. Adding a
 * token to `lightColors` widens `ThemeColors`, which makes `darkColors` fail
 * to typecheck until it gets the same token — the two can't drift.
 */
export const lightColors = {
	// Surfaces
	background: "#fafafa",
	surface: "#fff",
	surfaceAlt: "#f2f2f2",
	surfaceMuted: "#f0f0f0",

	// Text
	textPrimary: "#111",
	textBody: "#222",
	textDefault: "#333",
	textSecondary: "#555",
	textMuted: "#666",
	textFaint: "#777",
	textPlaceholder: "#999",
	textInverse: "#fff",

	// Borders
	border: "#eee",
	borderStrong: "#ddd",
	borderDashed: "#ccc",

	// Brand / interactive
	primary: "#3b82f6",
	primaryOn: "#fff",

	// Destructive
	danger: "#c00",

	// Equipment chip — amber family, kept distinct from tags so the two
	// don't get confused when they sit side-by-side in a ComponentSection.
	equipmentBg: "#fef3c7",
	equipmentBorder: "#f59e0b",
	equipmentText: "#78350f",

	// Overlay used on top of images (e.g. carousel page counter).
	overlay: "rgba(0,0,0,0.5)"
} as const

/**
 * Dark counterpart of `lightColors`, token for token.
 *
 * The surface ramp goes lighter as it goes "closer" to the user, which is
 * the inverse of the light palette (where `surface` is the brightest). That
 * inversion matters for the tokens that carry meaning through relative
 * lightness rather than through a fixed hue:
 *  - `border` doubles as the TagChip / servings-button fill, so it has to sit
 *    a step above `surface` here instead of a step below it.
 *  - `primary` is lightened (blue-400 rather than blue-500) to keep contrast
 *    against the dark background, which in turn flips `primaryOn` to a near
 *    black — white text on a light blue fill would be unreadable.
 *  - `textInverse` and `overlay` are deliberately unchanged: both describe
 *    content sitting on a photo, which is dark in either theme.
 */
export const darkColors: ThemeColors = {
	// Surfaces
	background: "#121212",
	surface: "#1c1c1e",
	surfaceAlt: "#2c2c2e",
	surfaceMuted: "#242426",

	// Text
	textPrimary: "#f5f5f5",
	textBody: "#ededed",
	textDefault: "#e0e0e0",
	textSecondary: "#c7c7c7",
	textMuted: "#a0a0a0",
	textFaint: "#8e8e8e",
	textPlaceholder: "#6f6f6f",
	textInverse: "#fff",

	// Borders
	border: "#2e2e30",
	borderStrong: "#3a3a3c",
	borderDashed: "#48484a",

	// Brand / interactive
	primary: "#60a5fa",
	primaryOn: "#0b1220",

	// Destructive
	danger: "#ff6b6b",

	// Equipment chip — the same amber family, re-anchored so the fill is the
	// dark end and the text the light end.
	equipmentBg: "#3b2f0b",
	equipmentBorder: "#b45309",
	equipmentText: "#fcd34d",

	// Overlay used on top of images (e.g. carousel page counter).
	overlay: "rgba(0,0,0,0.5)"
}

/** Shape every palette has to fill. Derived from the light palette. */
export type ThemeColors = { readonly [K in keyof typeof lightColors]: string }

export type ColorToken = keyof ThemeColors

/**
 * `"system"` defers to the OS setting and keeps following it as it changes;
 * the other two pin the app regardless of what the OS is doing.
 */
export type ThemeMode = "light" | "dark" | "system"

export const palettes: Record<"light" | "dark", ThemeColors> = {
	light: lightColors,
	dark: darkColors
}
