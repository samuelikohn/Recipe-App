import { useLayoutEffect, useState } from "react"
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View
} from "react-native"
import { ComponentSection } from "../components/ComponentSection"
import { EmptyState } from "../components/EmptyState"
import { RecipeImageCarousel } from "../components/RecipeImageCarousel"
import { TagChip } from "../components/TagChip"
import { useRecipe } from "../hooks/useRecipe"
import { ScreenProps } from "../navigation/types"
import { deleteRecipe } from "../db/repositories/recipes"
import { deleteImageFile } from "../utils/fileStorage"

export function RecipeDetailScreen({
	route,
	navigation
}: ScreenProps<"RecipeDetail">) {
	const { name } = route.params
	const { recipe, loading, error } = useRecipe(name)
	const [servings, setServings] = useState<number | null>(null)

	useLayoutEffect(() => {
		navigation.setOptions({
			title: recipe?.name ?? "Recipe",
			headerRight: () =>
				recipe ? (
					<Pressable
						onPress={() =>
							navigation.navigate("RecipeForm", {
								name: recipe.name
							})
						}
						hitSlop={8}
						style={styles.headerButton}
					>
						<Text style={styles.headerButtonText}>Edit</Text>
					</Pressable>
				) : null
		})
	}, [navigation, recipe])

	if (loading) {
		return <ActivityIndicator style={styles.loading} />
	}
	if (error) {
		return (
			<EmptyState title="Couldn't load recipe" subtitle={error.message} />
		)
	}
	if (!recipe) {
		return <EmptyState title="Recipe not found" />
	}

	const currentServings = servings ?? recipe.num_servings
	const multiplier = currentServings / recipe.num_servings

	async function onDelete() {
		Alert.alert(
			"Delete recipe?",
			`"${recipe!.name}" will be permanently removed.`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						// Clean up image files before dropping the row — after
						// the DB delete the filepaths are gone.
						for (const filepath of recipe!.images) {
							await deleteImageFile(filepath)
						}
						await deleteRecipe(recipe!.name)
						navigation.goBack()
					}
				}
			]
		)
	}

	return (
		<ScrollView style={styles.container}>
			{recipe.images.length > 0 ? (
				<RecipeImageCarousel images={recipe.images} />
			) : null}

			<View style={styles.header}>
				<Text style={styles.title}>{recipe.name}</Text>

				<View style={styles.servingsRow}>
					<Text style={styles.servingsLabel}>Servings</Text>
					<Pressable
						onPress={() =>
							setServings(Math.max(1, currentServings - 1))
						}
						hitSlop={8}
						style={styles.servingsButton}
					>
						<Text style={styles.servingsButtonText}>−</Text>
					</Pressable>
					<Text style={styles.servingsValue}>{currentServings}</Text>
					<Pressable
						onPress={() => setServings(currentServings + 1)}
						hitSlop={8}
						style={styles.servingsButton}
					>
						<Text style={styles.servingsButtonText}>+</Text>
					</Pressable>
					{servings !== null && servings !== recipe.num_servings ? (
						<Pressable
							onPress={() => setServings(null)}
							hitSlop={8}
							style={styles.resetButton}
						>
							<Text style={styles.resetText}>reset</Text>
						</Pressable>
					) : null}
				</View>

				{recipe.tags.length > 0 ? (
					<View style={styles.tagRow}>
						{recipe.tags.map((tag) => (
							<TagChip key={tag} label={tag} />
						))}
					</View>
				) : null}
			</View>

			{recipe.components.map((component) => (
				<ComponentSection
					key={component.id}
					component={component}
					servingsMultiplier={multiplier}
				/>
			))}

			<Pressable onPress={onDelete} style={styles.deleteButton}>
				<Text style={styles.deleteText}>Delete recipe</Text>
			</Pressable>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff"
	},
	loading: {
		marginTop: 40
	},
	headerButton: {
		paddingHorizontal: 8
	},
	headerButtonText: {
		fontSize: 16,
		color: "#3b82f6"
	},
	header: {
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#eee"
	},
	title: {
		fontSize: 24,
		fontWeight: "700",
		color: "#111"
	},
	servingsRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 12
	},
	servingsLabel: {
		fontSize: 14,
		color: "#555",
		marginRight: 12
	},
	servingsButton: {
		width: 28,
		height: 28,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#eee",
		marginHorizontal: 6
	},
	servingsButtonText: {
		fontSize: 18,
		color: "#333",
		fontWeight: "600"
	},
	servingsValue: {
		fontSize: 16,
		fontWeight: "600",
		color: "#111",
		minWidth: 24,
		textAlign: "center"
	},
	resetButton: {
		marginLeft: 12
	},
	resetText: {
		fontSize: 12,
		color: "#3b82f6"
	},
	tagRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginTop: 12
	},
	deleteButton: {
		margin: 24,
		padding: 12,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#c00",
		alignItems: "center"
	},
	deleteText: {
		color: "#c00",
		fontWeight: "600"
	}
})
