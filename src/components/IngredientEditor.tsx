import { useState } from "react"
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import { Ingredient } from "../models/types"
import { colors } from "../theme/colors"
import { fontSize } from "../theme/typography"

type Props = {
	ingredient: Ingredient
	onChange: (ingredient: Ingredient) => void
	onRemove: () => void
}

/**
 * One editable ingredient row inside ComponentFormScreen. Fully controlled
 * by the parent — this component owns no state of its own so the parent's
 * component-draft array is the single source of truth.
 */
export function IngredientEditor({ ingredient, onChange, onRemove }: Props) {
	// Amount is tracked as raw text locally so a trailing "." or "1.50"
	// isn't collapsed back to "1" (via amount.toString()) mid-keystroke,
	// which previously made it impossible to type decimal values at all.
	const [amountText, setAmountText] = useState(
		ingredient.amount ? ingredient.amount.toString() : ""
	)

	function updateAmount(text: string) {
		let cleaned = text.replace(/[^0-9.]/g, "")
		const firstDot = cleaned.indexOf(".")
		if (firstDot !== -1) {
			cleaned =
				cleaned.slice(0, firstDot + 1) +
				cleaned.slice(firstDot + 1).replace(/\./g, "")
		}
		setAmountText(cleaned)
		const value = cleaned === "" || cleaned === "." ? 0 : parseFloat(cleaned)
		onChange({
			...ingredient,
			amount: Number.isFinite(value) && value > 0 ? value : 0
		})
	}

	return (
		<View style={styles.container}>
			<View style={styles.row}>
				<TextInput
					style={[styles.input, styles.name]}
					value={ingredient.name}
					onChangeText={(name) => onChange({ ...ingredient, name })}
					placeholder="Ingredient"
					placeholderTextColor={colors.textPlaceholder}
					autoCorrect={false}
				/>
				<Pressable
					onPress={onRemove}
					hitSlop={8}
					style={styles.removeButton}
				>
					<Text style={styles.removeText}>✕</Text>
				</Pressable>
			</View>
			<View style={styles.row}>
				<TextInput
					style={[styles.input, styles.amount]}
					value={amountText}
					onChangeText={updateAmount}
					placeholder="Amount"
					placeholderTextColor={colors.textPlaceholder}
					keyboardType="decimal-pad"
				/>
				<TextInput
					style={[styles.input, styles.unit]}
					value={ingredient.unit}
					onChangeText={(unit) => onChange({ ...ingredient, unit })}
					placeholder="Unit"
					placeholderTextColor={colors.textPlaceholder}
					autoCorrect={false}
				/>
				<TextInput
					style={[styles.input, styles.prep]}
					value={ingredient.prep}
					onChangeText={(prep) => onChange({ ...ingredient, prep })}
					placeholder="Prep (chopped, etc.)"
					placeholderTextColor={colors.textPlaceholder}
					autoCorrect={false}
				/>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		paddingVertical: 8,
		borderBottomWidth: 1,
		borderBottomColor: colors.border
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 4
	},
	input: {
		borderWidth: 1,
		borderColor: colors.borderStrong,
		borderRadius: 6,
		paddingHorizontal: 8,
		paddingVertical: 6,
		fontSize: fontSize.body,
		color: colors.textBody,
		marginRight: 6,
		backgroundColor: colors.surface
	},
	name: {
		flex: 1
	},
	amount: {
		width: 80
	},
	unit: {
		width: 80
	},
	prep: {
		flex: 1,
		marginRight: 0
	},
	removeButton: {
		paddingHorizontal: 6
	},
	removeText: {
		color: colors.danger,
		fontSize: fontSize.input
	}
})
