import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { ComponentFormScreen } from "../screens/ComponentForm"
import { RecipeDetailScreen } from "../screens/RecipeDetail"
import { RecipeFormScreen } from "../screens/RecipeForm"
import { RecipeListScreen } from "../screens/RecipeList"
import { SearchScreen } from "../screens/Search"
import { RootStackParamList } from "./types"

const Stack = createNativeStackNavigator<RootStackParamList>()

/**
 * Native-stack root. RecipeList is the entry point; every other screen is
 * pushed onto it. Titles are set per-screen via navigation.setOptions in
 * each screen component so they can reflect route params (e.g. the recipe
 * name on RecipeDetail).
 *
 * Wrap this in <DatabaseProvider> at the app entry so the DB is ready
 * before any screen tries to read from it.
 */
export function RootNavigator() {
	return (
		<NavigationContainer>
			<Stack.Navigator initialRouteName="RecipeList">
				<Stack.Screen name="RecipeList" component={RecipeListScreen} />
				<Stack.Screen
					name="RecipeDetail"
					component={RecipeDetailScreen}
				/>
				<Stack.Screen name="RecipeForm" component={RecipeFormScreen} />
				<Stack.Screen
					name="ComponentForm"
					component={ComponentFormScreen}
				/>
				<Stack.Screen name="Search" component={SearchScreen} />
			</Stack.Navigator>
		</NavigationContainer>
	)
}
