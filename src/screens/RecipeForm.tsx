import { useEffect, useLayoutEffect, useRef, useState } from "react"
import {
	Alert,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View
} from "react-native"
import DraggableFlatList, {
	ScaleDecorator
} from "react-native-draggable-flatlist"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { DragHandle } from "../components/DragHandle"
import { EmptyState } from "../components/EmptyState"
import { ImagePickerGrid } from "../components/ImagePickerGrid"
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView"
import { TagInput } from "../components/TagInput"
import { createRecipe, updateRecipe } from "../db/repositories/recipes"
import { useRecipe } from "../hooks/useRecipe"
import { useRowKeys } from "../hooks/useRowKeys"
import { Component } from "../models/types"
import { RecipeDraft, ScreenProps } from "../navigation/types"
import { colors } from "../theme/colors"
import { fontSize, fontWeight, typography } from "../theme/typography"
import { joinDirectionSteps, splitDirectionSteps } from "../utils/directions"
import { validateRecipe } from "../utils/validation"

const EMPTY_DRAFT: RecipeDraft = {
	name: "",
	num_servings: 1,
	directions: "",
	prep_time: 0,
	cook_time: 0,
	ingredients: [],
	images: [],
	components: [],
	tags: []
}

type ComponentRow = {
	key: string
	component: Component
}

/**
 * Create/edit screen. If `route.params.name` is set the screen hydrates the
 * draft from the existing recipe (edit mode); otherwise it starts blank.
 * The draft is kept entirely in this screen's state — nothing is written to
 * the DB until the user hits Save, so back-navigating discards everything.
 */
export function RecipeFormScreen({
	route,
	navigation
}: ScreenProps<"RecipeForm">) {
	const editingName = route.params?.name
	const { recipe, loading } = useRecipe(editingName)
	const insets = useSafeAreaInsets()
	const [draft, setDraft] = useState<RecipeDraft>(EMPTY_DRAFT)
	const [initialDraft, setInitialDraft] = useState<RecipeDraft>(EMPTY_DRAFT)
	const [initialized, setInitialized] = useState(false)
	const [saving, setSaving] = useState(false)
	const allowNavigationRef = useRef(false)
	// Unsaved components all carry id 0, so the sortable list needs synthetic
	// keys kept parallel to draft.components.
	const componentKeys = useRowKeys("recipe-component")
	const componentRowKeys = componentKeys.sync(draft.components.length)
	const componentRows: ComponentRow[] = draft.components.map(
		(component, index) => ({ key: componentRowKeys[index], component })
	)
	const hasUnsavedChanges =
		initialized && JSON.stringify(draft) !== JSON.stringify(initialDraft)

	// Hydrate from the fetched recipe once when editing. We only do this on
	// the first successful load so the user's in-progress edits aren't
	// blown away by a background refetch triggered by useDbChangeSignal.
	useEffect(() => {
		if (!editingName) {
			setInitialDraft(EMPTY_DRAFT)
			setInitialized(true)
			return
		}
		if (!initialized && recipe) {
			setDraft(recipe)
			setInitialDraft(recipe)
			setInitialized(true)
		}
	}, [editingName, recipe, initialized])

	useEffect(() => {
		const unsubscribe = navigation.addListener("beforeRemove", (event) => {
			if (allowNavigationRef.current || !hasUnsavedChanges) return

			event.preventDefault()
			Alert.alert(
				"Discard changes?",
				"You have unsaved recipe changes. Discard them and leave this screen?",
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

	useLayoutEffect(() => {
		navigation.setOptions({
			title: editingName ? "Edit recipe" : "New recipe",
			headerRight: () => (
				<Pressable
					onPress={onSave}
					disabled={saving}
					hitSlop={8}
					style={styles.headerButton}
				>
					<Text style={styles.headerButtonText}>
						{saving ? "…" : "Save"}
					</Text>
				</Pressable>
			)
		})
	})

	async function onSave() {
		const name = draft.name.trim()
		const directions = joinDirectionSteps(
			splitDirectionSteps(draft.directions)
				.map((step) => step.trim())
				.filter((step) => step.length > 0)
		)
		const ingredients = draft.ingredients
			.map((i) => ({ ...i, name: i.name.trim() }))
			.filter((i) => i.name.length > 0)
		const toPersist = {
			...draft,
			name,
			directions,
			ingredients,
			id: draft.id ?? 0
		}

		const check = validateRecipe(toPersist)
		if (!check.ok) {
			Alert.alert(check.title, check.message)
			return
		}

		setSaving(true)
		try {
			if (editingName) {
				await updateRecipe(editingName, toPersist)
			} else {
				await createRecipe(toPersist)
			}
			allowNavigationRef.current = true
			navigation.goBack()
		} catch (err) {
			Alert.alert(
				"Save failed",
				err instanceof Error ? err.message : String(err)
			)
		} finally {
			setSaving(false)
		}
	}

	function updateServings(text: string) {
		const parsed = parseInt(text.replace(/[^0-9]/g, ""), 10)
		setDraft((d) => ({
			...d,
			num_servings: Number.isFinite(parsed) ? parsed : 0
		}))
	}

	function openComponentForm(index: number | undefined) {
		let initial
		if (typeof index === "undefined") {
			initial = null
		} else {
			initial = index >= 0 ? draft.components[index] : null
		}
		navigation.navigate("ComponentForm", {
			initial,
			onSubmit: (component) => {
				setDraft((d) => {
					const next = [...d.components]
					if (typeof index === "number" && index >= 0) {
						next[index] = component
					} else {
						next.push(component)
					}
					return { ...d, components: next }
				})
			}
		})
	}

	function removeComponent(index: number | undefined) {
		if (typeof index === "number") {
			componentKeys.remove(index)
			setDraft((d) => ({
				...d,
				components: d.components.filter((_, i) => i !== index)
			}))
		}
	}

	/**
	 * Applies a finished drag. The permutation comes from the row keys rather
	 * than the row objects captured at render time, so it lands on the
	 * freshest draft.
	 */
	function applyComponentOrder(orderedRows: ComponentRow[]) {
		const order = componentKeys.applyOrder(
			orderedRows.map((row) => row.key)
		)
		if (!order) return
		setDraft((d) => ({
			...d,
			components: order.map((index) => d.components[index])
		}))
	}

	if (editingName && loading && !initialized) {
		return <EmptyState title="Loading…" />
	}

	return (
		<KeyboardAwareScrollView
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
					placeholder="Recipe name"
					placeholderTextColor={colors.textPlaceholder}
				/>
			</Field>

			<Field label="Servings">
				<TextInput
					style={styles.input}
					value={
						draft.num_servings ? draft.num_servings.toString() : ""
					}
					onChangeText={updateServings}
					placeholder="1"
					placeholderTextColor={colors.textPlaceholder}
					keyboardType="number-pad"
				/>
			</Field>

			<Field label="Photos">
				<ImagePickerGrid
					images={draft.images}
					onChange={(images) => setDraft((d) => ({ ...d, images }))}
				/>
			</Field>

			<Field label="Tags">
				<TagInput
					values={draft.tags}
					onChange={(tags) => setDraft((d) => ({ ...d, tags }))}
				/>
			</Field>

			<Field label="Components">
				{componentRows.length > 0 && (
					<DraggableFlatList
						data={componentRows}
						keyExtractor={(row) => row.key}
						renderItem={({ item, getIndex, drag }) => (
							<ScaleDecorator>
								<View style={styles.componentRow}>
									<DragHandle drag={drag} />
									<Pressable
										onPress={() =>
											openComponentForm(getIndex())
										}
										style={styles.componentBody}
									>
										<Text style={styles.componentName}>
											{item.component.name || "(unnamed)"}
										</Text>
										<Text style={styles.componentMeta}>
											{item.component.ingredients.length}{" "}
											ingredient
											{item.component.ingredients
												.length === 1
												? ""
												: "s"}
										</Text>
									</Pressable>
									<Pressable
										onPress={() =>
											removeComponent(getIndex())
										}
										hitSlop={8}
										style={styles.componentRemove}
									>
										<Text
											style={styles.componentRemoveText}
										>
											✕
										</Text>
									</Pressable>
								</View>
							</ScaleDecorator>
						)}

						onDragEnd={({ data }) => applyComponentOrder(data)}
					/>
				)}
				<Pressable
					onPress={() => openComponentForm(-1)}
					style={styles.addButton}
				>
					<Text style={styles.addButtonText}>+ Add component</Text>
				</Pressable>
			</Field>
		</KeyboardAwareScrollView>
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
	timingRow: {
		flexDirection: "row",
		gap: 12
	},
	timingField: {
		flex: 1
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
	componentRow: {
		flexDirection: "row",
		alignItems: "center",
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 8,
		padding: 12,
		marginBottom: 8
	},
	componentBody: {
		flex: 1
	},
	componentName: {
		fontSize: fontSize.input,
		fontWeight: fontWeight.semibold,
		color: colors.textBody
	},
	componentMeta: {
		fontSize: fontSize.meta,
		color: colors.textMuted,
		marginTop: 2
	},
	componentRemove: {
		paddingHorizontal: 8
	},
	componentRemoveText: {
		color: colors.danger,
		fontSize: fontSize.componentTitle
	},
	addButton: {
		padding: 12,
		marginTop: 8,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: colors.primary,
		borderStyle: "dashed",
		alignItems: "center"
	},
	addButtonText: {
		color: colors.primary,
		fontWeight: fontWeight.semibold
	}
})
