/**
 * Semantic color tokens for the app. Values are the literals that were
 * inlined across components/screens during initial build — centralized
 * here so future palette tweaks (e.g. a dark theme) can happen in one
 * place. Callers should import these by role, not by hex.
 */
export const colors = {
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

export type ColorToken = keyof typeof colors
