import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { DatabaseProvider } from "./src/hooks/DataBaseProvider"
import { RootNavigator } from "./src/navigation/RootNavigator"

/**
 * App root. Loaded by `expo/AppEntry`, which handles the
 * `AppRegistry.registerComponent` step for us — this file just returns
 * the tree.
 *
 * Wrapping order:
 *  - SafeAreaProvider outermost so navigator headers and screens both get
 *    a valid inset frame.
 *  - DatabaseProvider next so the nav tree only renders after the schema
 *    has run (see DataBaseProvider.tsx).
 *  - StatusBar is a sibling — expo-status-bar is a no-op View that just
 *    configures the global status bar.
 */
export default function App() {
	return (
		<SafeAreaProvider>
			<DatabaseProvider>
				<RootNavigator />
			</DatabaseProvider>
			<StatusBar style="auto" />
		</SafeAreaProvider>
	)
}
