import { useEffect, useLayoutEffect, useRef, useState } from "react"
import {
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { DirectionsEditor } from "../components/DirectionsEditor"
import { EquipmentChip } from "../components/EquipmentChip"
import { IngredientEditor } from "../components/IngredientEditor"
import { Component, Ingredient } from "../models/types"
import { ScreenProps } from "../navigation/types"
import { colors } from "../theme/colors"
import { fontSize, fontWeight, typography } from "../theme/typography"
import { joinDirectionSteps, splitDirectionSteps } from "../utils/directions"
import { validateComponent } from "../utils/validation"

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
	const insets = useSafeAreaInsets()
	const [draft, setDraft] = useState<Component>(initial ?? EMPTY_COMPONENT)
	const [initialDraft] = useState<Component>(initial ?? EMPTY_COMPONENT)
	const [equipmentDraft, setEquipmentDraft] = useState("")
	const allowNavigationRef = useRef(false)
	const hasUnsavedChanges =
		JSON.stringify(draft) !== JSON.stringify(initialDraft) ||
		equipmentDraft.length > 0

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

	useEffect(() => {
		const unsubscribe = navigation.addListener("beforeRemove", (event) => {
			if (allowNavigationRef.current || !hasUnsavedChanges) return

			event.preventDefault()
			Alert.alert(
				"Discard changes?",
				"You have unsaved component changes. Discard them and leave this screen?",
				[
					{ text: "Keep editing", style: "cancel" },
					{
						text: "Discard",
						style: "destructive",
						onPress: () => {
							allowNavigationRef.current = true
							navigation.dispatch(event.data.action)
						}
					}
				]
			)
		})

		return unsubscribe
	}, [navigation, hasUnsavedChanges])

	function onDone() {
		const name = draft.name.trim()
		const cleanedIngredients = draft.ingredients
			.map((i) => ({ ...i, name: i.name.trim() }))
			.filter((i) => i.name.length > 0)
		const cleanedDirections = joinDirectionSteps(
			splitDirectionSteps(draft.directions)
				.map((step) => step.trim())
				.filter((step) => step.length > 0)
		)
		const cleaned = {
			...draft,
			name,
			ingredients: cleanedIngredients,
			directions: cleanedDirections
		}

		const check = validateComponent(cleaned)
		if (!check.ok) {
			Alert.alert(check.message)
			return
		}
		allowNavigationRef.current = true
		onSubmit(cleaned)
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
			contentContainerStyle={[
				styles.content,
				{ paddingBottom: 16 + insets.bottom }
			]}
			keyboardShouldPersistTaps="handled"
		>
			<Field label="Name">
				<TextInput
					style={styles.input}
					value={draft.name}
					onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
					placeholder="e.g. Sauce, Dough"
					placeholderTextColor={colors.textPlaceholder}
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
						placeholderTextColor={colors.textPlaceholder}
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
						placeholderTextColor={colors.textPlaceholder}
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
						placeholderTextColor={colors.textPlaceholder}
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
				<DirectionsEditor
					directions={draft.directions}
					onChange={(directions) =>
						setDraft((d) => ({ ...d, directions }))
					}
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
		backgroundColor: colors.surface
	},
	content: {
		padding: 16
	},
	headerButton: {
		paddingHorizontal: 8
	},
	headerButtonText: {
		fontSize: fontSize.input,
		color: colors.primary,
		fontWeight: fontWeight.semibold
	},
	field: {
		marginBottom: 20
	},
	fieldLabel: {
		...typography.sectionHeader,
		color: colors.textMuted,
		marginBottom: 6
	},
	input: {
		borderWidth: 1,
		borderColor: colors.borderStrong,
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: fontSize.input,
		color: colors.textBody,
		backgroundColor: colors.surface
	},
	timingRow: {
		flexDirection: "row",
		gap: 12
	},
	timingField: {
		flex: 1
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
		backgroundColor: colors.primary,
		borderRadius: 8
	},
	equipmentAddBtnText: {
		color: colors.primaryOn,
		fontWeight: fontWeight.semibold
	},
	addButton: {
		padding: 12,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: colors.primary,
		borderStyle: "dashed",
		alignItems: "center",
		marginTop: 8
	},
	addButtonText: {
		color: colors.primary,
		fontWeight: fontWeight.semibold
	}
})
