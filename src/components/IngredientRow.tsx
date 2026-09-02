import { StyleSheet, Text, View } from "react-native"
import { Ingredient } from "../models/types"
import { useThemedStyles } from "../theme/ThemeProvider"
import { ThemeColors } from "../theme/colors"
import { fontSize, fontWeight } from "../theme/typography"
import { formatAmount } from "../utils/format"

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
	const styles = useThemedStyles(makeStyles)
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

const makeStyles = (colors: ThemeColors) =>
	StyleSheet.create({
		row: {
			flexDirection: "row",
			paddingVertical: 4
		},
		amount: {
			width: 90,
			paddingRight: 4,
			fontSize: fontSize.body,
			fontWeight: fontWeight.semibold,
			color: colors.textDefault
		},
		name: {
			flex: 1,
			fontSize: fontSize.body,
			color: colors.textDefault
		}
	})
