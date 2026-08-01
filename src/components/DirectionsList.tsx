import { Fragment } from "react"
import { StyleSheet, Text, View } from "react-native"
import { colors } from "../theme/colors"
import { fontWeight, typography } from "../theme/typography"
import { splitDirectionSteps } from "../utils/directions"

type Props = {
	directions: string
}

/**
 * Read-only numbered rendering of a "\n"-joined directions string. Shared by
 * ComponentSection (per-component directions) and RecipeDetailScreen
 * (recipe-level directions) so both read-mode views parse/display steps
 * identically. Renders nothing for blank/whitespace-only directions —
 * callers use that to decide whether to show a "Directions" section header.
 */
export function DirectionsList({ directions }: Props) {
	const steps = splitDirectionSteps(directions)
		.map((step) => step.trim())
		.filter((step) => step.length > 0)

	return (
		<Fragment>
			{steps.map((step, index) => (
				<View key={index} style={styles.row}>
					<Text style={styles.number}>{index + 1}.</Text>
					<Text style={styles.step}>{step}</Text>
				</View>
			))}
		</Fragment>
	)
}

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		marginBottom: 4
	},
	number: {
		...typography.body,
		fontWeight: fontWeight.semibold,
		color: colors.textMuted,
		width: 24
	},
	step: {
		...typography.body,
		flex: 1,
		color: colors.textDefault
	}
})
