import { ReactNode, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { Ingredient } from "../models/types"
import { colors } from "../theme/colors"
import { fontSize } from "../theme/typography"
import { SortableTextInput } from "./SortableTextInput"

type Props = {
	ingredient: Ingredient
	onChange: (ingredient: Ingredient) => void
	onRemove: () => void
	dragHandle?: ReactNode
}

/**
 * One editable ingredient row. The parent owns the values, but the fields are
 * SortableTextInputs because these rows live inside a Sortable.Grid, which
 * delivers prop updates a commit late. Amount additionally keeps its own text
 * so intermediate decimal input like "1." survives the round trip.
 */
export function IngredientEditor({
	ingredient,
	onChange,
	onRemove,
	dragHandle
}: Props) {
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
		const value =
			cleaned === "" || cleaned === "." ? 0 : parseFloat(cleaned)
		onChange({
			...ingredient,
			amount: Number.isFinite(value) && value > 0 ? value : 0
		})
	}

	return (
		<View style={styles.container}>
			<View style={styles.editorRow}>
				{dragHandle}
				<View style={styles.fields}>
					<View style={styles.row}>
						<SortableTextInput
							style={[styles.input, styles.name]}
							value={ingredient.name}
							onChangeText={(name) =>
								onChange({ ...ingredient, name })
							}
							placeholder="Ingredient"
							placeholderTextColor={colors.textPlaceholder}
							autoCorrect={false}
						/>
						<Pressable
							onPress={onRemove}
							hitSlop={8}
							style={styles.removeButton}
						>
							<Text style={styles.removeText}>x</Text>
						</Pressable>
					</View>
					<View style={styles.row}>
						<SortableTextInput
							style={[styles.input, styles.amount]}
							value={amountText}
							onChangeText={updateAmount}
							placeholder="Amount"
							placeholderTextColor={colors.textPlaceholder}
							keyboardType="decimal-pad"
						/>
						<SortableTextInput
							style={[styles.input, styles.unit]}
							value={ingredient.unit}
							onChangeText={(unit) =>
								onChange({ ...ingredient, unit })
							}
							placeholder="Unit"
							placeholderTextColor={colors.textPlaceholder}
							autoCapitalize="none"
							autoCorrect={false}
						/>
						<SortableTextInput
							style={[styles.input, styles.prep]}
							value={ingredient.prep}
							onChangeText={(prep) =>
								onChange({ ...ingredient, prep })
							}
							placeholder="Prep (chopped, etc.)"
							placeholderTextColor={colors.textPlaceholder}
							autoCapitalize="none"
							autoCorrect={false}
						/>
					</View>
				</View>
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
	editorRow: {
		flexDirection: "row",
		alignItems: "stretch"
	},
	fields: {
		flex: 1
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
