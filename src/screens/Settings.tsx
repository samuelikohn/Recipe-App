import { useLayoutEffect } from "react"
import { StyleSheet, Switch, View } from "react-native"
import { ScreenProps } from "../navigation/types"
import { colors } from "../theme/colors"

export function SettingsScreen({ navigation }: ScreenProps<"Settings">) {
	useLayoutEffect(() => {
		navigation.setOptions({ title: "Settings" })
	}, [navigation])

	function toggleTheme(isDarkTheme: boolean) {}

	return (
		<View style={styles.container}>
			<Switch onValueChange={toggleTheme} />
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background
	},
	loading: {
		marginTop: 40
	}
})
