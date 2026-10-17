import { useLayoutEffect, useMemo, useState } from "react"
import {
	ActivityIndicator,
	Alert,
	FlatList,
	ScrollView,
	StyleSheet,
	View
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { EmptyState } from "../components/EmptyState"
import { RecipeCard } from "../components/RecipeCard"
import { SearchBar } from "../components/SearchBar"
import { TagChip } from "../components/TagChip"
import {
	ComponentNameConflictError,
	copyComponentToRecipe
} from "../db/repositories/recipes"
import { useRecipes } from "../hooks/useRecipes"
import { useSearch } from "../hooks/useSearch"
import { ScreenProps } from "../navigation/types"
import { useThemedStyles } from "../theme/ThemeProvider"
import { ThemeColors } from "../theme/colors"

/**
 * Recipe-list variant used to select a destination for a copied component.
 * It intentionally has no add-recipe button or header menu; the native stack
 * back button is the cancellation control.
 */
export function ComponentCopyTargetScreen({
	route,
	navigation
}: ScreenProps<"ComponentCopyTarget">) {
	const { sourceRecipeName, component } = route.params
	const [selectedTags, setSelectedTags] = useState<string[]>([])
	const [copying, setCopying] = useState(false)
	const insets = useSafeAreaInsets()
	const styles = useThemedStyles(makeStyles)
	const {
		recipes: allRecipes,
		loading: listLoading,
		error: listError
	} = useRecipes()
	const {
		query,
		setQuery,
		results: searchResults,
		loading: searchLoading,
		error: searchError
	} = useSearch()

	useLayoutEffect(() => {
		navigation.setOptions({ title: "Copy component to" })
	}, [navigation])

	const destinationRecipes = useMemo(
		() => allRecipes.filter((recipe) => recipe.name !== sourceRecipeName),
		[allRecipes, sourceRecipeName]
	)
	const allTags = useMemo(() => {
		const tags = new Set<string>()
		for (const recipe of destinationRecipes) {
			for (const tag of recipe.tags) tags.add(tag)
		}
		return Array.from(tags).sort((a, b) => a.localeCompare(b))
	}, [destinationRecipes])
	const recipes = useMemo(() => {
		const matchingSearch = query.trim() ? searchResults : destinationRecipes
		return matchingSearch.filter(
			(recipe) =>
				recipe.name !== sourceRecipeName &&
				selectedTags.every((tag) => recipe.tags.includes(tag))
		)
	}, [
		destinationRecipes,
		query,
		searchResults,
		selectedTags,
		sourceRecipeName
	])
	const loading = listLoading || (query.trim().length > 0 && searchLoading)
	const error = listError ?? (query.trim().length > 0 ? searchError : null)

	function toggleTag(tag: string) {
		setSelectedTags((current) =>
			current.includes(tag)
				? current.filter((selected) => selected !== tag)
				: [...current, tag]
		)
	}

	async function selectRecipe(targetRecipeName: string) {
		if (copying) return
		setCopying(true)
		try {
			await copyComponentToRecipe(targetRecipeName, component)
			navigation.goBack()
		} catch (error) {
			const message =
				error instanceof ComponentNameConflictError
					? `"${targetRecipeName}" already has a component named "${component.name}".`
					: "Couldn't copy the component."
			Alert.alert("Copy component failed", message, [
				{ text: "OK", onPress: () => navigation.goBack() }
			])
		} finally {
			setCopying(false)
		}
	}

	if (error) {
		return (
			<EmptyState
				title="Couldn't load recipes"
				subtitle={error.message}
			/>
		)
	}

	return (
		<View style={styles.container}>
			<SearchBar
				value={query}
				onChangeText={setQuery}
				placeholder="Search name, tags, ingredients"
				autoFocus
			/>

			{allTags.length > 0 ? (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.tagRow}
				>
					{allTags.map((tag) => (
						<TagChip
							key={tag}
							label={tag}
							selected={selectedTags.includes(tag)}
							onPress={() => toggleTag(tag)}
						/>
					))}
				</ScrollView>
			) : null}

			{loading ? (
				<ActivityIndicator style={styles.loading} />
			) : recipes.length === 0 ? (
				<EmptyState
					title={
						query.trim().length > 0 || selectedTags.length > 0
							? "No recipes match"
							: "No other recipes yet"
					}
				/>
			) : (
				<FlatList
					data={recipes}
					keyExtractor={(recipe) => recipe.name}
					contentContainerStyle={{ paddingBottom: insets.bottom }}
					renderItem={({ item }) => (
						<RecipeCard
							recipe={item}
							onPress={() => selectRecipe(item.name)}
						/>
					)}
				/>
			)}
		</View>
	)
}

const makeStyles = (colors: ThemeColors) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.background
		},
		tagRow: {
			paddingHorizontal: 8,
			paddingBottom: 8
		},
		loading: {
			marginTop: 40
		}
	})
