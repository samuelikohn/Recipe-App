import { ReactNode, useLayoutEffect } from "react"
import { StyleSheet, Switch, Text, View } from "react-native"
import { usePreferences } from "../hooks/PreferencesProvider"
import { ScreenProps } from "../navigation/types"
import { useTheme, useThemedStyles } from "../theme/ThemeProvider"
import { ThemeColors } from "../theme/colors"
import { fontSize, typography } from "../theme/typography"

export function SettingsScreen({ navigation }: ScreenProps<"Settings">) {
	const { mode, isDark, setMode } = useTheme()
	const { preferences, setPreference } = usePreferences()
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
			<Section title="Appearance">
				<ToggleRow
					title="Dark theme"
					subtitle={
						mode === "system"
							? "Following your device setting"
							: isDark
								? "Always on"
								: "Always off"
					}
					value={isDark}
					onValueChange={toggleTheme}
				/>
			</Section>

			<Section title="Recipe list">
				<ToggleRow
					title="Show recipe count"
					subtitle="Put the number of recipes being shown in the header"
					value={preferences.showRecipeCount}
					onValueChange={(next) =>
						setPreference("showRecipeCount", next)
					}
				/>
			</Section>
		</View>
	)
}

/** Labelled group of rows, styled as one banded block. */
function Section({ title, children }: { title: string; children: ReactNode }) {
	const styles = useThemedStyles(makeStyles)

	return (
		<View>
			<Text style={styles.sectionHeader}>{title}</Text>
			<View style={styles.section}>{children}</View>
		</View>
	)
}

type ToggleRowProps = {
	title: string
	subtitle: string
	value: boolean
	onValueChange: (value: boolean) => void
}

/** One setting: label and explanation on the left, switch on the right. */
function ToggleRow({ title, subtitle, value, onValueChange }: ToggleRowProps) {
	const { colors } = useTheme()
	const styles = useThemedStyles(makeStyles)

	return (
		<View style={styles.row}>
			<View style={styles.rowLabel}>
				<Text style={styles.rowTitle}>{title}</Text>
				<Text style={styles.rowSubtitle}>{subtitle}</Text>
			</View>
			<Switch
				value={value}
				onValueChange={onValueChange}
				trackColor={{
					false: colors.borderStrong,
					true: colors.primary
				}}
				thumbColor={colors.surface}
			/>
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
