import { TextStyle } from "react-native"

/**
 * Typography scale and named text styles. Font sizes correspond to the
 * inline literals used across components: 11 (fine print), 12 (meta/label),
 * 14 (body), 16 (input/button), 18 (component title), 24 (recipe title),
 * 28 (large icon).
 *
 * `TextStyle` typing on the named styles lets callers spread them straight
 * into a StyleSheet entry without losing type-safety on `fontWeight`.
 */
export const fontSize = {
	fine: 11,
	meta: 12,
	body: 14,
	input: 16,
	componentTitle: 18,
	recipeTitle: 24,
	icon: 28
} as const

export const fontWeight = {
	regular: "400",
	semibold: "600",
	bold: "700"
} as const satisfies Record<string, TextStyle["fontWeight"]>

export const typography = {
	recipeTitle: {
		fontSize: fontSize.recipeTitle,
		fontWeight: fontWeight.bold
	},
	componentTitle: {
		fontSize: fontSize.componentTitle,
		fontWeight: fontWeight.bold
	},
	body: {
		fontSize: fontSize.body,
		fontWeight: fontWeight.regular,
		lineHeight: 20
	},
	input: {
		fontSize: fontSize.input,
		fontWeight: fontWeight.regular
	},
	buttonLabel: {
		fontSize: fontSize.input,
		fontWeight: fontWeight.semibold
	},
	meta: {
		fontSize: fontSize.meta,
		fontWeight: fontWeight.regular
	},
	// Small-caps-ish section header used above form field groups and lists.
	sectionHeader: {
		fontSize: fontSize.meta,
		fontWeight: fontWeight.bold,
		textTransform: "uppercase",
		letterSpacing: 0.5
	}
} as const satisfies Record<string, TextStyle>
