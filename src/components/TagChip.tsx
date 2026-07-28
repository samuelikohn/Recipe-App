import { Pressable, StyleSheet, Text, View } from "react-native"

type Props = {
	label: string
	selected?: boolean
	onPress?: () => void
	onRemove?: () => void
}

/**
 * Small tag pill. Renders as a Pressable when `onPress` is provided (used
 * for the filter row on RecipeListScreen), otherwise as a static View
 * (used inside RecipeCard and RecipeDetail). If `onRemove` is provided the
 * chip shows a trailing ✕ that fires it — used by TagInput.
 */
export function TagChip({ label, selected, onPress, onRemove }: Props) {
	const body = (
		<View style={[styles.chip, selected && styles.chipSelected]}>
			<Text style={[styles.label, selected && styles.labelSelected]}>
				{label}
			</Text>
			{onRemove ? (
				<Pressable onPress={onRemove} hitSlop={8} style={styles.remove}>
					<Text style={styles.removeText}>✕</Text>
				</Pressable>
			) : null}
		</View>
	)

	if (onPress) {
		return (
			<Pressable onPress={onPress} style={styles.pressable}>
				{body}
			</Pressable>
		)
	}
	return body
}

const styles = StyleSheet.create({
	pressable: {
		marginRight: 6,
		marginBottom: 6
	},
	chip: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 10,
		paddingVertical: 4,
		backgroundColor: "#eee",
		borderRadius: 12,
		marginRight: 6,
		marginBottom: 6
	},
	chipSelected: {
		backgroundColor: "#3b82f6"
	},
	label: {
		fontSize: 12,
		color: "#333"
	},
	labelSelected: {
		color: "#fff"
	},
	remove: {
		marginLeft: 6
	},
	removeText: {
		fontSize: 12,
		color: "#666"
	}
})
