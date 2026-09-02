import { useLayoutEffect } from "react"
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { EmptyState } from "../components/EmptyState"
import { RecipeCard } from "../components/RecipeCard"
import { SearchBar } from "../components/SearchBar"
import { usePreferences } from "../hooks/PreferencesProvider"
import { useSearch } from "../hooks/useSearch"
import { ScreenProps } from "../navigation/types"
import { useThemedStyles } from "../theme/ThemeProvider"
import { ThemeColors } from "../theme/colors"

export function SearchScreen({ navigation }: ScreenProps<"Search">) {
	const { query, setQuery, results, loading, error } = useSearch()
	const insets = useSafeAreaInsets()
	const styles = useThemedStyles(makeStyles)
	const { preferences } = usePreferences()

	// Only meaningful once a query has actually produced a result list — the
	// screen shows a prompt rather than results for an empty query, and "(0)"
	// against that prompt would read as "no recipes exist".
	const headerTitle =
		preferences.showRecipeCount &&
		!loading &&
		!error &&
		query.trim().length > 0
			? `Search (${results.length})`
			: "Search"

	useLayoutEffect(() => {
		navigation.setOptions({ title: headerTitle })
	}, [navigation, headerTitle])

	return (
		<View style={styles.container}>
			<SearchBar
				value={query}
				onChangeText={setQuery}
				autoFocus
				placeholder="Search name, tags, ingredients"
			/>

			{error ? (
				<EmptyState title="Search failed" subtitle={error.message} />
			) : loading ? (
				<ActivityIndicator style={styles.loading} />
			) : query.trim().length === 0 ? (
				<EmptyState
					title="Search your recipes"
					subtitle="Match on recipe name, tags, or ingredient names."
				/>
			) : results.length === 0 ? (
				<EmptyState title="No matches" />
			) : (
				<FlatList
					data={results}
					keyExtractor={(recipe) => recipe.name}
					contentContainerStyle={{
						paddingBottom: insets.bottom
					}}
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

const makeStyles = (colors: ThemeColors) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.background
		},
		loading: {
			marginTop: 40
		}
	})
