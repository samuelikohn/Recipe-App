import Slider from "@react-native-community/slider"
import { ReactNode, useLayoutEffect, useState } from "react"
import { StyleSheet, Switch, Text, View } from "react-native"
import { usePreferences } from "../hooks/PreferencesProvider"
import { ScreenProps } from "../navigation/types"
import { useTheme, useThemedStyles } from "../theme/ThemeProvider"
import { ThemeColors } from "../theme/colors"
import {
	FONT_SCALE_MAX,
	FONT_SCALE_MIN,
	FONT_SCALE_STEP,
	fontSize,
	typography
} from "../theme/typography"

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
				<TextSizeRow />
			</Section>

			<Section title="Recipe List">
				<ToggleRow
					title="Show recipe count"
					subtitle="Put the number of recipes being shown in the header"
					value={preferences.showRecipeCount}
					onValueChange={(next) =>
						setPreference("showRecipeCount", next)
					}
				/>
			</Section>

			<Section title="Recipe Details">
				<ToggleRow
					title="Show component copy button"
					subtitle="Displays a copy icon on recipe components to copy the component to another recipe"
					value={preferences.showComponentCopy}
					onValueChange={(next) =>
						setPreference("showComponentCopy", next)
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

/**
 * Text-size slider. While dragging, only this row previews the new size; the
 * preference is committed on release, so the rest of the app re-lays out
 * once rather than on every frame under the user's finger.
 */
function TextSizeRow() {
	const { colors, fontScale, setFontScale } = useTheme()
	const styles = useThemedStyles(makeStyles)
	const [draft, setDraft] = useState(fontScale)

	// Slider steps accumulate float error (1.1500000000000001); snapping to
	// two decimals keeps stored values and style-cache keys clean.
	const snap = (value: number) => Math.round(value * 100) / 100

	return (
		<View style={[styles.row, styles.sliderRow]}>
			<View style={styles.sliderHeader}>
				<Text style={styles.rowTitle}>Text size</Text>
				<Text style={styles.sliderValue}>
					{Math.round(draft * 100)}%
				</Text>
			</View>
			<Slider
				value={fontScale}
				minimumValue={FONT_SCALE_MIN}
				maximumValue={FONT_SCALE_MAX}
				step={FONT_SCALE_STEP}
				onValueChange={(value) => setDraft(snap(value))}
				onSlidingComplete={(value) => setFontScale(snap(value))}
				minimumTrackTintColor={colors.primary}
				maximumTrackTintColor={colors.borderStrong}
				thumbTintColor={colors.primary}
			/>
			{/* styles are already scaled by fontScale; divide it back out so
			    the sample shows exactly the size being previewed. */}
			<Text
				style={[
					styles.rowSubtitle,
					{
						fontSize:
							(styles.rowSubtitle.fontSize * draft) / fontScale
					}
				]}
			>
				The quick brown fox jumps over the lazy dog.
			</Text>
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
		},
		// The slider row stacks title, slider, and sample vertically instead
		// of the label-left/control-right layout of the other rows.
		sliderRow: {
			flexDirection: "column",
			alignItems: "stretch"
		},
		sliderHeader: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center"
		},
		sliderValue: {
			fontSize: fontSize.body,
			color: colors.textMuted
		}
	})
