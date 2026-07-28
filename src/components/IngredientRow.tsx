import { StyleSheet, Text, View } from "react-native"
import { Ingredient } from "../models/types"

type Props = {
	ingredient: Ingredient
	servingsMultiplier?: number
}

/**
 * Read-only rendering of one ingredient line as it appears inside
 * ComponentSection on RecipeDetail. `servingsMultiplier` lets the detail
 * screen scale amounts when the user bumps servings above the recipe's
 * base value — defaults to 1× so callers that don't care can omit it.
 */
export function IngredientRow({ ingredient, servingsMultiplier = 1 }: Props) {
	const scaled = ingredient.amount * servingsMultiplier
	const amountText = formatAmount(scaled)
	const unitText = ingredient.unit ? ` ${ingredient.unit}` : ""
	const prepText = ingredient.prep ? `, ${ingredient.prep}` : ""

	return (
		<View style={styles.row}>
			<Text style={styles.amount}>
				{amountText}
				{unitText}
			</Text>
			<Text style={styles.name}>
				{ingredient.name}
				{prepText}
			</Text>
		</View>
	)
}

function formatAmount(value: number): string {
	if (!Number.isFinite(value)) return ""
	if (Number.isInteger(value)) return value.toString()
	// Keep it simple — one or two decimals depending on how "clean" the value is.
	return value.toFixed(value * 10 === Math.round(value * 10) ? 1 : 2)
}

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		paddingVertical: 4
	},
	amount: {
		width: 90,
		fontSize: 14,
		fontWeight: "600",
		color: "#333"
	},
	name: {
		flex: 1,
		fontSize: 14,
		color: "#333"
	}
})
