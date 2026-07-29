/**
 * Formats a numeric ingredient amount for display in IngredientRow.
 *
 *  - Integers render bare ("2").
 *  - One-decimal-clean values render with one place ("1.5").
 *  - Anything else falls back to two places ("0.33").
 *  - Non-finite or zero values render as "" so the row just shows the
 *    unit and ingredient name — useful for "salt to taste" style
 *    ingredients where the amount doesn't matter.
 */
export function formatAmount(value: number): string {
	if (!Number.isFinite(value) || value === 0) return ""
	if (Number.isInteger(value)) return value.toString()
	return value.toFixed(value * 10 === Math.round(value * 10) ? 1 : 2)
}

/**
 * Renders minutes as "1h 30m" / "45m" / "0m". Used by ComponentSection
 * for prep and cook times.
 */
export function formatDuration(minutes: number): string {
	if (!Number.isFinite(minutes) || minutes <= 0) return "0m"
	const total = Math.round(minutes)
	const hours = Math.floor(total / 60)
	const mins = total % 60
	if (hours === 0) return `${mins}m`
	if (mins === 0) return `${hours}h`
	return `${hours}h ${mins}m`
}
