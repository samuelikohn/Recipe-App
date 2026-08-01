import { StyleSheet, Text, View } from "react-native"
import { Component, ingredientKey } from "../models/types"
import { colors } from "../theme/colors"
import { fontSize, typography } from "../theme/typography"
import { splitDirectionSteps } from "../utils/directions"
import { formatDuration } from "../utils/format"
import { DirectionsList } from "./DirectionsList"
import { EquipmentChip } from "./EquipmentChip"
import { IngredientRow } from "./IngredientRow"

type Props = {
	component: Component
	servingsMultiplier?: number
}

/**
 * One recipe-component in read mode (RecipeDetailScreen). Renders the name,
 * timing, ingredient list scaled by servingsMultiplier, equipment chips,
 * and the directions blob.
 */
export function ComponentSection({ component, servingsMultiplier = 1 }: Props) {
	const totalTime = component.prep_time + component.cook_time
	const directionSteps = splitDirectionSteps(component.directions)
		.map((step) => step.trim())
		.filter((step) => step.length > 0)

	return (
		<View style={styles.container}>
			<Text style={styles.title}>{component.name}</Text>
			{totalTime > 0 ? (
				<Text style={styles.timing}>
					Prep {formatDuration(component.prep_time)} · Cook{" "}
					{formatDuration(component.cook_time)} · Total{" "}
					{formatDuration(totalTime)}
				</Text>
			) : null}

			{component.ingredients.length > 0 ? (
				<View style={styles.section}>
					<Text style={styles.sectionHeader}>Ingredients</Text>
					{component.ingredients.map((ingredient) => (
						<IngredientRow
							key={ingredientKey(ingredient)}
							ingredient={ingredient}
							servingsMultiplier={servingsMultiplier}
						/>
					))}
				</View>
			) : null}

			{component.equipment.length > 0 ? (
				<View style={styles.section}>
					<Text style={styles.sectionHeader}>Equipment</Text>
					<View style={styles.equipmentRow}>
						{component.equipment.map((item) => (
							<EquipmentChip key={item} label={item} />
						))}
					</View>
				</View>
			) : null}

			{directionSteps.length > 0 ? (
				<View style={styles.section}>
					<Text style={styles.sectionHeader}>Directions</Text>
					<DirectionsList directions={component.directions} />
				</View>
			) : null}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		paddingVertical: 16,
		paddingHorizontal: 16,
		borderBottomWidth: 1,
		borderBottomColor: colors.border
	},
	title: {
		...typography.componentTitle,
		color: colors.textBody
	},
	timing: {
		marginTop: 2,
		fontSize: fontSize.meta,
		color: colors.textMuted
	},
	section: {
		marginTop: 12
	},
	sectionHeader: {
		...typography.sectionHeader,
		color: colors.textMuted,
		marginBottom: 6
	},
	equipmentRow: {
		flexDirection: "row",
		flexWrap: "wrap"
	}
})
