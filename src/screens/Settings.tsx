import { useLayoutEffect } from "react"
import { StyleSheet, Switch, Text, View } from "react-native"
import { ScreenProps } from "../navigation/types"
import { useTheme, useThemedStyles } from "../theme/ThemeProvider"
import { ThemeColors } from "../theme/colors"
import { fontSize, typography } from "../theme/typography"

export function SettingsScreen({ navigation }: ScreenProps<"Settings">) {
	const { mode, colors, isDark, setMode } = useTheme()
	const styles = useThemedStyles(makeStyles)

	useLayoutEffect(() => {
		navigation.setOptions({ title: "Settings" })
	}, [navigation])

	// Flipping the switch pins the app to a palette. Until it's touched the
	// app is on "system" and the switch simply mirrors the OS.
	function toggleTheme(isDarkTheme: boolean) {
		setMode(isDarkTheme ? "dark" : "light")
	}

	return (
		<View style={styles.container}>
			<Text style={styles.sectionHeader}>Appearance</Text>
			<View style={styles.section}>
				<View style={styles.row}>
					<View style={styles.rowLabel}>
						<Text style={styles.rowTitle}>Dark theme</Text>
						<Text style={styles.rowSubtitle}>
							{mode === "system"
								? "Following your device setting"
								: isDark
									? "Always on"
									: "Always off"}
						</Text>
					</View>
					<Switch
						value={isDark}
						onValueChange={toggleTheme}
						trackColor={{
							false: colors.borderStrong,
							true: colors.primary
						}}
						thumbColor={colors.surface}
					/>
				</View>
			</View>
		</View>
	)
}

const makeStyles = (colors: ThemeColors) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.background
		},
		sectionHeader: {
			...typography.sectionHeader,
			color: colors.textMuted,
			paddingHorizontal: 16,
			paddingTop: 20,
			paddingBottom: 6
		},
		section: {
			backgroundColor: colors.surface,
			borderTopWidth: 1,
			borderBottomWidth: 1,
			borderColor: colors.border
		},
		row: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			paddingHorizontal: 16,
			paddingVertical: 12
		},
		rowLabel: {
			flex: 1,
			marginRight: 12
		},
		rowTitle: {
			fontSize: fontSize.input,
			color: colors.textBody
		},
		rowSubtitle: {
			marginTop: 2,
			fontSize: fontSize.meta,
			color: colors.textMuted
		}
	})
