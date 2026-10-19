import { Ionicons } from "@expo/vector-icons"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { Component, ingredientKey } from "../models/types"
import { useTheme, useThemedStyles } from "../theme/ThemeProvider"
import { ThemeColors } from "../theme/colors"
import { fontSize, fontWeight, typography } from "../theme/typography"
import { splitDirectionSteps } from "../utils/directions"
import { formatDuration } from "../utils/format"
import { DirectionsList } from "./DirectionsList"
import { EquipmentChip } from "./EquipmentChip"
import { IngredientRow } from "./IngredientRow"

type Props = {
	component: Component
	servingsMultiplier?: number
	onCopyToRecipe: () => void
}

/**
 * One recipe-component in read mode (RecipeDetailScreen). Renders the name,
 * timing, ingredient list scaled by servingsMultiplier, equipment chips,
 * and the directions blob.
 */
export function ComponentSection({
	component,
	servingsMultiplier = 1,
	onCopyToRecipe
}: Props) {
	const styles = useThemedStyles(makeStyles)
	const totalTime = component.prep_time + component.cook_time
	const directionSteps = splitDirectionSteps(component.directions)
		.map((step) => step.trim())
		.filter((step) => step.length > 0)
	const { colors, fontScale } = useTheme()

	return (
		<View style={styles.container}>
			<View style={styles.titleRow}>
				<Text style={styles.title}>{component.name}</Text>
				<Pressable
					onPress={onCopyToRecipe}
					hitSlop={8}
					accessibilityLabel="Copy recipe component"
				>
					<Ionicons
						name="copy-outline"
						size={18 * fontScale}
						color={colors.textInverse}
					/>
				</Pressable>
			</View>

			{totalTime > 0 ? (
				<Text style={styles.timing}>
					Prep {formatDuration(component.prep_time)} · Cook{" "}
					{formatDuration(component.cook_time)} · Total{" "}
					{formatDuration(totalTime)}
				</Text>
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

			{directionSteps.length > 0 ? (
				<View style={styles.section}>
					<Text style={styles.sectionHeader}>Directions</Text>
					<DirectionsList directions={component.directions} />
				</View>
			) : null}
		</View>
	)
}

const makeStyles = (colors: ThemeColors) =>
	StyleSheet.create({
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
		},
		copyButton: {
			alignSelf: "flex-start",
			marginTop: 16,
			paddingHorizontal: 12,
			paddingVertical: 8,
			borderRadius: 8,
			backgroundColor: colors.primary
		},
		copyButtonText: {
			fontSize: fontSize.meta,
			fontWeight: fontWeight.semibold,
			color: colors.primaryOn
		},
		titleRow: {
			display: "flex",
			flexDirection: "row",
			justifyContent: "space-between"
		}
	})
