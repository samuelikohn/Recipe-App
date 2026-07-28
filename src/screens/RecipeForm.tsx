import { useEffect, useLayoutEffect, useState } from "react"
import {
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View
} from "react-native"
import { EmptyState } from "../components/EmptyState"
import { ImagePickerGrid } from "../components/ImagePickerGrid"
import { TagInput } from "../components/TagInput"
import { useRecipe } from "../hooks/useRecipe"
import { RecipeDraft, ScreenProps } from "../navigation/types"
import { createRecipe, updateRecipe } from "../db/repositories/recipes"

const EMPTY_DRAFT: RecipeDraft = {
	name: "",
	num_servings: 1,
	images: [],
	components: [],
	tags: []
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
	const [draft, setDraft] = useState<RecipeDraft>(EMPTY_DRAFT)
	const [initialized, setInitialized] = useState(false)
	const [saving, setSaving] = useState(false)

	// Hydrate from the fetched recipe once when editing. We only do this on
	// the first successful load so the user's in-progress edits aren't
	// blown away by a background refetch triggered by useDbChangeSignal.
	useEffect(() => {
		if (!editingName) {
			setInitialized(true)
			return
		}
		if (!initialized && recipe) {
			setDraft(recipe)
			setInitialized(true)
		}
	}, [editingName, recipe, initialized])

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
		if (!name) {
			Alert.alert("Name is required")
			return
		}
		if (draft.num_servings < 1) {
			Alert.alert("Servings must be at least 1")
			return
		}

		setSaving(true)
		try {
			const toPersist = { ...draft, name, id: draft.id ?? 0 }
			if (editingName) {
				await updateRecipe(editingName, toPersist)
			} else {
				await createRecipe(toPersist)
			}
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

	function openComponentForm(index: number) {
		const initial = index >= 0 ? draft.components[index] : null
		navigation.navigate("ComponentForm", {
			initial,
			onSubmit: (component) => {
				setDraft((d) => {
					const next = [...d.components]
					if (index >= 0) next[index] = component
					else next.push(component)
					return { ...d, components: next }
				})
			}
		})
	}

	function removeComponent(index: number) {
		setDraft((d) => ({
			...d,
			components: d.components.filter((_, i) => i !== index)
		}))
	}

	if (editingName && loading && !initialized) {
		return <EmptyState title="Loading…" />
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
					placeholder="Recipe name"
					placeholderTextColor="#999"
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
					placeholderTextColor="#999"
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
				{draft.components.map((component, index) => (
					<View key={index} style={styles.componentRow}>
						<Pressable
							onPress={() => openComponentForm(index)}
							style={styles.componentBody}
						>
							<Text style={styles.componentName}>
								{component.name || "(unnamed)"}
							</Text>
							<Text style={styles.componentMeta}>
								{component.ingredients.length} ingredient
								{component.ingredients.length === 1 ? "" : "s"}
							</Text>
						</Pressable>
						<Pressable
							onPress={() => removeComponent(index)}
							hitSlop={8}
							style={styles.componentRemove}
						>
							<Text style={styles.componentRemoveText}>✕</Text>
						</Pressable>
					</View>
				))}
				<Pressable
					onPress={() => openComponentForm(-1)}
					style={styles.addButton}
				>
					<Text style={styles.addButtonText}>+ Add component</Text>
				</Pressable>
			</Field>
		</ScrollView>
	)
}

function Field({
	label,
	children
}: {
	label: string
	children: React.ReactNode
}) {
	return (
		<View style={styles.field}>
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
	componentRow: {
		flexDirection: "row",
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#eee",
		borderRadius: 8,
		marginBottom: 8,
		padding: 12
	},
	componentBody: {
		flex: 1
	},
	componentName: {
		fontSize: 16,
		fontWeight: "600",
		color: "#222"
	},
	componentMeta: {
		fontSize: 12,
		color: "#666",
		marginTop: 2
	},
	componentRemove: {
		paddingHorizontal: 8
	},
	componentRemoveText: {
		color: "#c00",
		fontSize: 18
	},
	addButton: {
		padding: 12,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#3b82f6",
		borderStyle: "dashed",
		alignItems: "center"
	},
	addButtonText: {
		color: "#3b82f6",
		fontWeight: "600"
	}
})
