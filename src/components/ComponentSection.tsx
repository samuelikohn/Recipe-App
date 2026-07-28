import { StyleSheet, Text, View } from "react-native"
import { Component } from "../models/types"
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

	return (
		<View style={styles.container}>
			<Text style={styles.title}>{component.name}</Text>
			{totalTime > 0 ? (
				<Text style={styles.timing}>
					Prep {component.prep_time}m · Cook {component.cook_time}m ·
					Total {totalTime}m
				</Text>
			) : null}

			{component.ingredients.length > 0 ? (
				<View style={styles.section}>
					<Text style={styles.sectionHeader}>Ingredients</Text>
					{component.ingredients.map((ingredient) => (
						<IngredientRow
							key={ingredient.name}
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

			{component.directions ? (
				<View style={styles.section}>
					<Text style={styles.sectionHeader}>Directions</Text>
					<Text style={styles.directions}>
						{component.directions}
					</Text>
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
		borderBottomColor: "#eee"
	},
	title: {
		fontSize: 18,
		fontWeight: "700",
		color: "#222"
	},
	timing: {
		marginTop: 2,
		fontSize: 12,
		color: "#666"
	},
	section: {
		marginTop: 12
	},
	sectionHeader: {
		fontSize: 12,
		fontWeight: "700",
		color: "#666",
		textTransform: "uppercase",
		letterSpacing: 0.5,
		marginBottom: 6
	},
	equipmentRow: {
		flexDirection: "row",
		flexWrap: "wrap"
	},
	directions: {
		fontSize: 14,
		lineHeight: 20,
		color: "#333"
	}
})
