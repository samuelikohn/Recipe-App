import {
	DarkTheme,
	DefaultTheme,
	NavigationContainer,
	Theme
} from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useTheme } from "../theme/ThemeProvider"
import { ThemeColors } from "../theme/colors"
import { ComponentFormScreen } from "../screens/ComponentForm"
import { RecipeDetailScreen } from "../screens/RecipeDetail"
import { RecipeFormScreen } from "../screens/RecipeForm"
import { RecipeListScreen } from "../screens/RecipeList"
import { SearchScreen } from "../screens/Search"
import { SettingsScreen } from "../screens/Settings"
import { RootStackParamList } from "./types"

const Stack = createNativeStackNavigator<RootStackParamList>()

/**
 * Maps our palette onto the handful of colors React Navigation paints itself
 * with (header bar and title, the card behind a screen during a push
 * transition, the back-button tint). Screens style their own backgrounds, so
 * this only has to cover the chrome.
 */
function navigationTheme(colors: ThemeColors, isDark: boolean): Theme {
	const base = isDark ? DarkTheme : DefaultTheme
	return {
		...base,
		colors: {
			...base.colors,
			primary: colors.primary,
			background: colors.background,
			card: colors.surface,
			text: colors.textPrimary,
			border: colors.border
		}
	}
}

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
	const { colors, isDark } = useTheme()

	return (
		<NavigationContainer theme={navigationTheme(colors, isDark)}>
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
				<Stack.Screen name="Settings" component={SettingsScreen} />
			</Stack.Navigator>
		</NavigationContainer>
	)
}
