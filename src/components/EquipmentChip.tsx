import { Pressable, StyleSheet, Text, View } from "react-native"
import { colors } from "../theme/colors"
import { fontSize } from "../theme/typography"

type Props = {
	label: string
	onRemove?: () => void
}

/**
 * Chip for a piece of equipment attached to a component. Visually distinct
 * from TagChip so the two never get confused when they appear side-by-side
 * inside the same ComponentSection.
 */
export function EquipmentChip({ label, onRemove }: Props) {
	return (
		<View style={styles.chip}>
			<Text style={styles.label}>{label}</Text>
			{onRemove ? (
				<Pressable onPress={onRemove} hitSlop={8} style={styles.remove}>
					<Text style={styles.removeText}>✕</Text>
				</Pressable>
			) : null}
		</View>
	)
}

const styles = StyleSheet.create({
	chip: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 10,
		paddingVertical: 4,
		backgroundColor: colors.equipmentBg,
		borderRadius: 6,
		borderWidth: 1,
		borderColor: colors.equipmentBorder,
		marginRight: 6,
		marginBottom: 6
	},
	label: {
		fontSize: fontSize.meta,
		color: colors.equipmentText
	},
	remove: {
		marginLeft: 6
	},
	removeText: {
		fontSize: fontSize.meta,
		color: colors.equipmentText
	}
})
