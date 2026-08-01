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
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ComponentSection } from "../components/ComponentSection"
import { DirectionsList } from "../components/DirectionsList"
import { EmptyState } from "../components/EmptyState"
import { IngredientRow } from "../components/IngredientRow"
import { RecipeImageCarousel } from "../components/RecipeImageCarousel"
import { TagChip } from "../components/TagChip"
import { useRecipe } from "../hooks/useRecipe"
import { ingredientKey } from "../models/types"
import { ScreenProps } from "../navigation/types"
import { colors } from "../theme/colors"
import { fontSize, fontWeight, typography } from "../theme/typography"
import { splitDirectionSteps } from "../utils/directions"
import { deleteRecipe } from "../db/repositories/recipes"
import { deleteImageFile } from "../utils/fileStorage"
import { formatDuration } from "../utils/format"

export function RecipeDetailScreen({
	route,
	navigation
}: ScreenProps<"RecipeDetail">) {
	const { name } = route.params
	const { recipe, loading, error } = useRecipe(name)
	const insets = useSafeAreaInsets()
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
	const totalTime = recipe.prep_time + recipe.cook_time
	const hasDirections =
		splitDirectionSteps(recipe.directions).filter(
			(step) => step.trim().length > 0
		).length > 0

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
		<ScrollView
			style={styles.container}
			contentContainerStyle={{ paddingBottom: insets.bottom }}
		>
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

				{totalTime > 0 ? (
					<Text style={styles.timing}>
						Prep {formatDuration(recipe.prep_time)} - Cook{" "}
						{formatDuration(recipe.cook_time)} - Total{" "}
						{formatDuration(totalTime)}
					</Text>
				) : null}
			</View>

			{recipe.ingredients.length > 0 ? (
				<View style={styles.section}>
					<Text style={styles.sectionHeader}>Ingredients</Text>
					{recipe.ingredients.map((ingredient) => (
						<IngredientRow
							key={ingredientKey(ingredient)}
							ingredient={ingredient}
							servingsMultiplier={multiplier}
						/>
					))}
				</View>
			) : null}

			{hasDirections ? (
				<View style={styles.section}>
					<Text style={styles.sectionHeader}>Directions</Text>
					<DirectionsList directions={recipe.directions} />
				</View>
			) : null}

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
		backgroundColor: colors.surface
	},
	loading: {
		marginTop: 40
	},
	headerButton: {
		paddingHorizontal: 8
	},
	headerButtonText: {
		fontSize: fontSize.input,
		color: colors.primary
	},
	header: {
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: colors.border
	},
	title: {
		fontSize: fontSize.recipeTitle,
		fontWeight: fontWeight.bold,
		color: colors.textPrimary
	},
	servingsRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 12
	},
	servingsLabel: {
		fontSize: fontSize.body,
		color: colors.textSecondary,
		marginRight: 12
	},
	servingsButton: {
		width: 28,
		height: 28,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.border,
		marginHorizontal: 6
	},
	servingsButtonText: {
		fontSize: fontSize.componentTitle,
		color: colors.textDefault,
		fontWeight: fontWeight.semibold
	},
	servingsValue: {
		fontSize: fontSize.input,
		fontWeight: fontWeight.semibold,
		color: colors.textPrimary,
		minWidth: 24,
		textAlign: "center"
	},
	resetButton: {
		marginLeft: 12
	},
	resetText: {
		fontSize: fontSize.meta,
		color: colors.primary
	},
	tagRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginTop: 12
	},
	timing: {
		marginTop: 12,
		fontSize: fontSize.meta,
		color: colors.textMuted
	},
	section: {
		paddingHorizontal: 16,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: colors.border
	},
	sectionHeader: {
		...typography.sectionHeader,
		color: colors.textMuted,
		marginBottom: 6
	},
	deleteButton: {
		margin: 24,
		padding: 12,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: colors.danger,
		alignItems: "center"
	},
	deleteText: {
		color: colors.danger,
		fontWeight: fontWeight.semibold
	}
})
