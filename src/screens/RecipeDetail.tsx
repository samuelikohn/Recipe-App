import * as Clipboard from "expo-clipboard"
import * as Haptics from "expo-haptics"
import { useLayoutEffect, useState, useCallback } from "react"
import {
	ActivityIndicator,
	Alert,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	ToastAndroid,
	View
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ComponentSection } from "../components/ComponentSection"
import { EmptyState } from "../components/EmptyState"
import { HeaderMenu } from "../components/HeaderMenu"
import { RecipeImageCarousel } from "../components/RecipeImageCarousel"
import { TagChip } from "../components/TagChip"
import {
	createRecipe,
	deleteRecipe,
	recipeNameExists
} from "../db/repositories/recipes"
import { useRecipe } from "../hooks/useRecipe"
import { Recipe } from "../models/types"
import { ScreenProps } from "../navigation/types"
import { useThemedStyles } from "../theme/ThemeProvider"
import { ThemeColors } from "../theme/colors"
import { fontSize, fontWeight, typography } from "../theme/typography"
import { deleteImageFile, persistPickedImage } from "../utils/fileStorage"
import { formatDuration } from "../utils/format"
import { exportRecipeAsPdf } from "../utils/recipePdf"
import { formatRecipeAsText } from "../utils/recipeText"

async function onCopyAsText(recipe: Recipe, servings: number) {
	try {
		await Clipboard.setStringAsync(formatRecipeAsText(recipe, servings))
	} catch {
		Alert.alert("Couldn't copy recipe")
		return
	}
	// iOS has no toast; a success haptic confirms without making the user
	// dismiss anything.
	if (Platform.OS === "ios") {
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
	} else {
		ToastAndroid.show("Copied to clipboard", ToastAndroid.SHORT)
	}
}

async function onExportAsPdf(recipe: Recipe, servings: number) {
	try {
		await exportRecipeAsPdf(recipe, servings)
	} catch {
		Alert.alert("Couldn't export recipe as PDF")
	}
}

/**
 * Saves a copy of `recipe` as "<name> (copy)" — or "(copy 2)", "(copy 3)",
 * … if that name is taken, since names are unique — and returns the new name.
 *
 * Image files are duplicated rather than shared: filepaths are the images
 * table's primary key, and deleting either recipe deletes its files, which
 * would otherwise break the other one's photos.
 */
async function duplicateRecipe(recipe: Recipe): Promise<string> {
	let name = `${recipe.name} (copy)`
	for (let n = 2; await recipeNameExists(name); n++) {
		name = `${recipe.name} (copy ${n})`
	}

	const images: string[] = []
	try {
		for (const filepath of recipe.images) {
			images.push(await persistPickedImage(filepath))
		}
		await createRecipe({ ...recipe, name, images })
	} catch (e) {
		for (const filepath of images) {
			await deleteImageFile(filepath)
		}
		throw e
	}
	return name
}

export function RecipeDetailScreen({
	route,
	navigation
}: ScreenProps<"RecipeDetail">) {
	const { name } = route.params
	const { recipe, loading, error } = useRecipe(name)
	const insets = useSafeAreaInsets()
	const styles = useThemedStyles(makeStyles)
	const [servings, setServings] = useState<number | null>(null)

	const onDelete = useCallback(async () => {
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
	}, [navigation, recipe])

	useLayoutEffect(() => {
		navigation.setOptions({
			title: recipe?.name ?? "Recipe",
			headerRight: () =>
				recipe ? (
					<HeaderMenu
						items={[
							{
								label: "Edit",
								warn: false,
								onPress: () =>
									navigation.navigate("RecipeForm", {
										name: recipe.name
									})
							},
							{
								label: "Duplicate",
								warn: false,
								onPress: async () => {
									try {
										const copyName =
											await duplicateRecipe(recipe)
										navigation.replace("RecipeDetail", {
											name: copyName
										})
									} catch {
										Alert.alert("Couldn't duplicate recipe")
									}
								}
							},
							{
								label: "Copy as text",
								warn: false,
								onPress: () =>
									onCopyAsText(
										recipe,
										servings ?? recipe.num_servings
									)
							},
							{
								label: "Export as PDF",
								warn: false,
								onPress: () =>
									onExportAsPdf(
										recipe,
										servings ?? recipe.num_servings
									)
							},
							{
								label: "Delete Recipe",
								warn: true,
								onPress: onDelete
							}
						]}
					/>
				) : null
		})
	}, [navigation, recipe, servings, onDelete])

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
	const prepTime = recipe.components.reduce(
		(sum, component) => sum + component.prep_time,
		0
	)
	const cookTime = recipe.components.reduce(
		(sum, component) => sum + component.cook_time,
		0
	)
	const totalTime = prepTime + cookTime

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
						Prep {formatDuration(prepTime)} · Cook{" "}
						{formatDuration(cookTime)} · Total{" "}
						{formatDuration(totalTime)}
					</Text>
				) : null}
			</View>

			{recipe.components.map((component) => (
				<ComponentSection
					key={component.id}
					component={component}
					servingsMultiplier={multiplier}
					onCopyToRecipe={() =>
						navigation.navigate("ComponentCopyTarget", {
							sourceRecipeName: recipe.name,
							component
						})
					}
				/>
			))}
		</ScrollView>
	)
}

const makeStyles = (colors: ThemeColors, fontScale: number) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.surface
		},
		loading: {
			marginTop: 40
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
			width: 28 * fontScale,
			height: 28 * fontScale,
			borderRadius: 14 * fontScale,
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
		}
	})
