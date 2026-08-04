import { StyleSheet, Text, View } from "react-native"
import Sortable from "react-native-sortables"
import { colors } from "../theme/colors"
import { fontSize, fontWeight } from "../theme/typography"

/**
 * Grip that starts a hold-and-drag reorder. Must be rendered inside a
 * react-native-sortables item whose container sets `customHandle` — the drag
 * gesture then lives on the handle alone, so the TextInputs and remove
 * buttons filling the rest of the row keep behaving normally.
 *
 * Sortable.Handle only accepts `style`/`mode`/`children`, so the
 * accessibility props go on an inner View.
 */
export function DragHandle() {
	return (
		<Sortable.Handle style={styles.handle}>
			<View
				accessibilityLabel="Drag to reorder"
				accessibilityRole="adjustable"
			>
				<Text style={styles.handleText}>|||</Text>
			</View>
		</Sortable.Handle>
	)
}

const styles = StyleSheet.create({
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
