import { registerRootComponent } from "expo"
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { DatabaseProvider } from "./src/hooks/DataBaseProvider"
import { RootNavigator } from "./src/navigation/RootNavigator"

/**
 * App entry. Wrapping order matters:
 *  - SafeAreaProvider must be outermost so both the navigator (for header
 *    insets) and any screen that reads insets get a valid frame.
 *  - DatabaseProvider comes next so the whole nav tree renders only after
 *    the schema has run — see DataBaseProvider.tsx for the rationale.
 *  - StatusBar is a sibling of the tree, not a wrapper — expo-status-bar
 *    is a no-op View that just configures the status bar globally.
 */
function App() {
	return (
		<SafeAreaProvider>
			<DatabaseProvider>
				<RootNavigator />
			</DatabaseProvider>
			<StatusBar style="auto" />
		</SafeAreaProvider>
	)
}

registerRootComponent(App)

export default App
