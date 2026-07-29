import { useLayoutEffect, useMemo, useState } from "react"
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View
} from "react-native"
import { EmptyState } from "../components/EmptyState"
import { RecipeCard } from "../components/RecipeCard"
import { TagChip } from "../components/TagChip"
import { useRecipes } from "../hooks/useRecipes"
import { ScreenProps } from "../navigation/types"
import { colors } from "../theme/colors"

/**
 * Root of the app: full recipe list with a tag-filter chip row above it.
 * Tag chips filter with AND semantics (see useRecipes). The header adds
 * `+` (new recipe) and `⌕` (search) buttons on the right.
 */
export function RecipeListScreen({ navigation }: ScreenProps<"RecipeList">) {
	const [selectedTags, setSelectedTags] = useState<string[]>([])
	const { recipes, loading, error } = useRecipes(selectedTags)

	// Compute the union of tags across all currently visible recipes so the
	// filter row shows tags that actually match something. We derive it from
	// an unfiltered call would be cleaner, but with one query already in
	// flight it's simpler to accept that the chip row narrows down as the
	// user picks tags.
	const allTags = useMemo(() => {
		const set = new Set<string>()
		for (const recipe of recipes) {
			for (const tag of recipe.tags) set.add(tag)
		}
		for (const tag of selectedTags) set.add(tag)
		return Array.from(set).sort((a, b) => a.localeCompare(b))
	}, [recipes, selectedTags])

	useLayoutEffect(() => {
		navigation.setOptions({
			title: "Recipes",
			headerRight: () => (
				<View style={styles.headerButtons}>
					<Pressable
						onPress={() => navigation.navigate("Search")}
						hitSlop={8}
						style={styles.headerButton}
					>
						<Text style={styles.headerButtonText}>⌕</Text>
					</Pressable>
					<Pressable
						onPress={() => navigation.navigate("RecipeForm", {})}
						hitSlop={8}
						style={styles.headerButton}
					>
						<Text style={styles.headerButtonText}>＋</Text>
					</Pressable>
				</View>
			)
		})
	}, [navigation])

	function toggleTag(tag: string) {
		setSelectedTags((current) =>
			current.includes(tag)
				? current.filter((t) => t !== tag)
				: [...current, tag]
		)
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
						selectedTags.length
							? "No recipes match those tags"
							: "No recipes yet"
					}
					subtitle={
						selectedTags.length
							? undefined
							: "Tap + to add your first one."
					}
				/>
			) : (
				<FlatList
					data={recipes}
					keyExtractor={(recipe) => recipe.name}
					renderItem={({ item }) => (
						<RecipeCard
							recipe={item}
							onPress={() =>
								navigation.navigate("RecipeDetail", {
									name: item.name
								})
							}
						/>
					)}
				/>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background
	},
	headerButtons: {
		flexDirection: "row",
		alignItems: "center"
	},
	headerButton: {
		paddingHorizontal: 8
	},
	headerButtonText: {
		fontSize: 24,
		color: colors.primary
	},
	tagRow: {
		paddingHorizontal: 8,
		paddingVertical: 8
	},
	loading: {
		marginTop: 40
	}
})
