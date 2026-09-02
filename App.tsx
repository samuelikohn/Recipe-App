import { StyleSheet } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { KeyboardProvider } from "react-native-keyboard-controller"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { DatabaseProvider } from "./src/hooks/DataBaseProvider"
import { PreferencesProvider } from "./src/hooks/PreferencesProvider"
import { RootNavigator } from "./src/navigation/RootNavigator"
import { ThemedStatusBar, ThemeProvider } from "./src/theme/ThemeProvider"

/**
 * App root. Loaded by `expo/AppEntry`, which handles the
 * `AppRegistry.registerComponent` step for us — this file just returns
 * the tree.
 *
 * Wrapping order:
 *  - GestureHandlerRootView outermost, required by every
 *    react-native-gesture-handler consumer (the drag-to-reorder lists).
 *    It needs an explicit `flex: 1` or the whole app renders zero-height.
 *  - KeyboardProvider next, required by react-native-keyboard-controller's
 *    KeyboardAwareScrollView (see components/KeyboardAwareScrollView.tsx).
 *  - SafeAreaProvider next so navigator headers and screens both get
 *    a valid inset frame.
 *  - PreferencesProvider next, holding children back for one DB read while it
 *    loads the saved settings. It's above ThemeProvider because that's where
 *    the light/dark choice comes from.
 *  - ThemeProvider next, above DatabaseProvider because DatabaseProvider's
 *    own loading/error screens are themed.
 *  - DatabaseProvider next so the nav tree only renders after the schema
 *    has run (see DataBaseProvider.tsx).
 *  - StatusBar is a sibling of the nav tree but still inside ThemeProvider —
 *    expo-status-bar is a no-op View that just configures the global status
 *    bar, and ThemedStatusBar picks its glyph color off the active theme.
 */
export default function App() {
	return (
		<GestureHandlerRootView style={styles.root}>
			<KeyboardProvider>
				<SafeAreaProvider>
					<PreferencesProvider>
						<ThemeProvider>
							<DatabaseProvider>
								<RootNavigator />
							</DatabaseProvider>
							<ThemedStatusBar />
						</ThemeProvider>
					</PreferencesProvider>
				</SafeAreaProvider>
			</KeyboardProvider>
		</GestureHandlerRootView>
	)
}

const styles = StyleSheet.create({
	root: {
		flex: 1
	}
})
