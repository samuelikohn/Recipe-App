import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useThemedStyles } from "../theme/ThemeProvider"
import { ThemeColors } from "../theme/colors"
import { fontSize, fontWeight } from "../theme/typography"

/**
 * Grip that starts a hold-and-drag reorder.
 */
export function DragHandle({ drag }: { drag: () => void }) {
	const styles = useThemedStyles(makeStyles)

	return (
		<TouchableOpacity
			style={styles.handle}
			onLongPress={drag}
			delayLongPress={500}
		>
			<View
				accessibilityLabel="Drag to reorder"
				accessibilityRole="adjustable"
			>
				<Text style={styles.handleText}>☰</Text>
			</View>
		</TouchableOpacity>
	)
}

const makeStyles = (colors: ThemeColors) =>
	StyleSheet.create({
		handle: {
			width: 32,
			alignSelf: "stretch",
			alignItems: "center",
			justifyContent: "center",
			marginRight: 6
		},
		handleText: {
			fontSize: fontSize.body,
			fontWeight: fontWeight.semibold,
			color: colors.textMuted
		}
	})
