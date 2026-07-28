import { useLayoutEffect, useState } from "react"
import {
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View
} from "react-native"
import { EquipmentChip } from "../components/EquipmentChip"
import { IngredientEditor } from "../components/IngredientEditor"
import { Component, Ingredient } from "../models/types"
import { ScreenProps } from "../navigation/types"

const EMPTY_COMPONENT: Component = {
	id: 0,
	name: "",
	directions: "",
	prep_time: 0,
	cook_time: 0,
	ingredients: [],
	equipment: []
}

const EMPTY_INGREDIENT: Ingredient = {
	name: "",
	amount: 0,
	unit: "",
	prep: ""
}

/**
 * Push-navigated child of RecipeFormScreen. Edits a Component in-memory and
 * hands the result back through the `onSubmit` callback that
 * RecipeFormScreen supplied via nav params — nothing is persisted here
 * directly, since the parent owns the whole recipe draft until the user
 * saves.
 */
export function ComponentFormScreen({
	route,
	navigation
}: ScreenProps<"ComponentForm">) {
	const { initial, onSubmit } = route.params
	const [draft, setDraft] = useState<Component>(initial ?? EMPTY_COMPONENT)
	const [equipmentDraft, setEquipmentDraft] = useState("")

	useLayoutEffect(() => {
		navigation.setOptions({
			title: initial ? "Edit component" : "New component",
			headerRight: () => (
				<Pressable
					onPress={onDone}
					hitSlop={8}
					style={styles.headerButton}
				>
					<Text style={styles.headerButtonText}>Done</Text>
				</Pressable>
			)
		})
	})

	function onDone() {
		const name = draft.name.trim()
		if (!name) {
			Alert.alert("Component name is required")
			return
		}
		const cleanedIngredients = draft.ingredients
			.map((i) => ({ ...i, name: i.name.trim() }))
			.filter((i) => i.name.length > 0)
		onSubmit({ ...draft, name, ingredients: cleanedIngredients })
		navigation.goBack()
	}

	function updateNumber(field: "prep_time" | "cook_time", text: string) {
		const parsed = parseInt(text.replace(/[^0-9]/g, ""), 10)
		setDraft((d) => ({
			...d,
			[field]: Number.isFinite(parsed) ? parsed : 0
		}))
	}

	function addIngredient() {
		setDraft((d) => ({
			...d,
			ingredients: [...d.ingredients, { ...EMPTY_INGREDIENT }]
		}))
	}

	function updateIngredient(index: number, ingredient: Ingredient) {
		setDraft((d) => {
			const next = [...d.ingredients]
			next[index] = ingredient
			return { ...d, ingredients: next }
		})
	}

	function removeIngredient(index: number) {
		setDraft((d) => ({
			...d,
			ingredients: d.ingredients.filter((_, i) => i !== index)
		}))
	}

	function addEquipment() {
		const trimmed = equipmentDraft.trim()
		if (!trimmed) return
		const exists = draft.equipment.some(
			(e) => e.toLowerCase() === trimmed.toLowerCase()
		)
		if (!exists) {
			setDraft((d) => ({ ...d, equipment: [...d.equipment, trimmed] }))
		}
		setEquipmentDraft("")
	}

	function removeEquipment(item: string) {
		setDraft((d) => ({
			...d,
			equipment: d.equipment.filter((e) => e !== item)
		}))
	}

	return (
		<ScrollView
			style={styles.container}
			keyboardShouldPersistTaps="handled"
		>
			<Field label="Name">
				<TextInput
					style={styles.input}
					value={draft.name}
					onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
					placeholder="e.g. Sauce, Dough"
					placeholderTextColor="#999"
				/>
			</Field>

			<View style={styles.timingRow}>
				<Field label="Prep (min)" style={styles.timingField}>
					<TextInput
						style={styles.input}
						value={
							draft.prep_time ? draft.prep_time.toString() : ""
						}
						onChangeText={(t) => updateNumber("prep_time", t)}
						placeholder="0"
						placeholderTextColor="#999"
						keyboardType="number-pad"
					/>
				</Field>
				<Field label="Cook (min)" style={styles.timingField}>
					<TextInput
						style={styles.input}
						value={
							draft.cook_time ? draft.cook_time.toString() : ""
						}
						onChangeText={(t) => updateNumber("cook_time", t)}
						placeholder="0"
						placeholderTextColor="#999"
						keyboardType="number-pad"
					/>
				</Field>
			</View>

			<Field label="Ingredients">
				{draft.ingredients.map((ingredient, index) => (
					<IngredientEditor
						key={index}
						ingredient={ingredient}
						onChange={(next) => updateIngredient(index, next)}
						onRemove={() => removeIngredient(index)}
					/>
				))}
				<Pressable onPress={addIngredient} style={styles.addButton}>
					<Text style={styles.addButtonText}>+ Add ingredient</Text>
				</Pressable>
			</Field>

			<Field label="Equipment">
				<View style={styles.equipmentRow}>
					{draft.equipment.map((item) => (
						<EquipmentChip
							key={item}
							label={item}
							onRemove={() => removeEquipment(item)}
						/>
					))}
				</View>
				<View style={styles.equipmentAddRow}>
					<TextInput
						style={[styles.input, styles.equipmentInput]}
						value={equipmentDraft}
						onChangeText={setEquipmentDraft}
						onSubmitEditing={addEquipment}
						placeholder="Add equipment"
						placeholderTextColor="#999"
						returnKeyType="done"
						blurOnSubmit={false}
					/>
					<Pressable
						onPress={addEquipment}
						style={styles.equipmentAddBtn}
					>
						<Text style={styles.equipmentAddBtnText}>Add</Text>
					</Pressable>
				</View>
			</Field>

			<Field label="Directions">
				<TextInput
					style={[styles.input, styles.directionsInput]}
					value={draft.directions}
					onChangeText={(directions) =>
						setDraft((d) => ({ ...d, directions }))
					}
					placeholder="Step-by-step instructions"
					placeholderTextColor="#999"
					multiline
					textAlignVertical="top"
				/>
			</Field>
		</ScrollView>
	)
}

function Field({
	label,
	children,
	style
}: {
	label: string
	children: React.ReactNode
	style?: object
}) {
	return (
		<View style={[styles.field, style]}>
			<Text style={styles.fieldLabel}>{label}</Text>
			{children}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		padding: 16
	},
	headerButton: {
		paddingHorizontal: 8
	},
	headerButtonText: {
		fontSize: 16,
		color: "#3b82f6",
		fontWeight: "600"
	},
	field: {
		marginBottom: 20
	},
	fieldLabel: {
		fontSize: 12,
		fontWeight: "700",
		color: "#666",
		textTransform: "uppercase",
		letterSpacing: 0.5,
		marginBottom: 6
	},
	input: {
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: 16,
		color: "#222",
		backgroundColor: "#fff"
	},
	timingRow: {
		flexDirection: "row",
		gap: 12
	},
	timingField: {
		flex: 1
	},
	directionsInput: {
		minHeight: 120
	},
	equipmentRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginBottom: 8
	},
	equipmentAddRow: {
		flexDirection: "row",
		alignItems: "center"
	},
	equipmentInput: {
		flex: 1,
		marginRight: 8
	},
	equipmentAddBtn: {
		paddingHorizontal: 14,
		paddingVertical: 10,
		backgroundColor: "#3b82f6",
		borderRadius: 8
	},
	equipmentAddBtnText: {
		color: "#fff",
		fontWeight: "600"
	},
	addButton: {
		padding: 12,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#3b82f6",
		borderStyle: "dashed",
		alignItems: "center",
		marginTop: 8
	},
	addButtonText: {
		color: "#3b82f6",
		fontWeight: "600"
	}
})
