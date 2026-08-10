import { useLayoutEffect } from "react"
import { StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ScreenProps } from "../navigation/types"
import { colors } from "../theme/colors"

export function SettingsScreen({ navigation }: ScreenProps<"Settings">) {

	useLayoutEffect(() => {
		navigation.setOptions({ title: "Settings" })
	}, [navigation])

	return <View style={styles.container}></View>
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
