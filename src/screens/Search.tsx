import { useLayoutEffect } from "react"
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native"
import { EmptyState } from "../components/EmptyState"
import { RecipeCard } from "../components/RecipeCard"
import { SearchBar } from "../components/SearchBar"
import { useSearch } from "../hooks/useSearch"
import { ScreenProps } from "../navigation/types"

export function SearchScreen({ navigation }: ScreenProps<"Search">) {
	const { query, setQuery, results, loading, error } = useSearch()

	useLayoutEffect(() => {
		navigation.setOptions({ title: "Search" })
	}, [navigation])

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
		backgroundColor: "#fafafa"
	},
	loading: {
		marginTop: 40
	}
})
