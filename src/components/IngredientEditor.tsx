import { Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import { Ingredient } from "../models/types"

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
	function updateAmount(text: string) {
		const cleaned = text.replace(/[^0-9.]/g, "")
		const value = cleaned === "" ? 0 : parseFloat(cleaned)
		onChange({
			...ingredient,
			amount: Number.isFinite(value) ? value : 0
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
					placeholderTextColor="#999"
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
					value={
						ingredient.amount ? ingredient.amount.toString() : ""
					}
					onChangeText={updateAmount}
					placeholder="Amount"
					placeholderTextColor="#999"
					keyboardType="decimal-pad"
				/>
				<TextInput
					style={[styles.input, styles.unit]}
					value={ingredient.unit}
					onChangeText={(unit) => onChange({ ...ingredient, unit })}
					placeholder="Unit"
					placeholderTextColor="#999"
					autoCorrect={false}
				/>
				<TextInput
					style={[styles.input, styles.prep]}
					value={ingredient.prep}
					onChangeText={(prep) => onChange({ ...ingredient, prep })}
					placeholder="Prep (chopped, etc.)"
					placeholderTextColor="#999"
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
		borderBottomColor: "#eee"
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 4
	},
	input: {
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 6,
		paddingHorizontal: 8,
		paddingVertical: 6,
		fontSize: 14,
		color: "#222",
		marginRight: 6,
		backgroundColor: "#fff"
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
		color: "#c00",
		fontSize: 16
	}
})
