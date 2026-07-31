import { Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import { colors } from "../theme/colors"
import { fontSize, fontWeight } from "../theme/typography"
import { joinDirectionSteps, splitDirectionSteps } from "../utils/directions"

type Props = {
	directions: string
	onChange: (directions: string) => void
}

/**
 * Numbered-step editor for a Component's directions, shown inside
 * ComponentFormScreen. The underlying data is still a single "\n"-joined
 * TEXT field (see utils/directions) — this component just presents it as
 * one row per step and re-joins on every edit.
 */
export function DirectionsEditor({ directions, onChange }: Props) {
	const steps = splitDirectionSteps(directions)

	function updateStep(index: number, text: string) {
		const next = [...steps]
		next[index] = text
		onChange(joinDirectionSteps(next))
	}

	function removeStep(index: number) {
		onChange(joinDirectionSteps(steps.filter((_, i) => i !== index)))
	}

	function addStep() {
		onChange(joinDirectionSteps([...steps, ""]))
	}

	return (
		<View>
			{steps.map((step, index) => (
				<View key={index} style={styles.row}>
					<Text style={styles.stepNumber}>{index + 1}.</Text>
					<TextInput
						style={[styles.input, styles.stepInput]}
						value={step}
						onChangeText={(text) => updateStep(index, text)}
						placeholder={`Step ${index + 1}`}
						placeholderTextColor={colors.textPlaceholder}
						multiline
					/>
					<Pressable
						onPress={() => removeStep(index)}
						hitSlop={8}
						style={styles.removeButton}
					>
						<Text style={styles.removeText}>✕</Text>
					</Pressable>
				</View>
			))}
			<Pressable onPress={addStep} style={styles.addButton}>
				<Text style={styles.addButtonText}>+ Add step</Text>
			</Pressable>
		</View>
	)
}

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		alignItems: "flex-start",
		marginBottom: 8
	},
	stepNumber: {
		width: 20,
		marginTop: 10,
		fontSize: fontSize.input,
		fontWeight: fontWeight.semibold,
		color: colors.textMuted
	},
	input: {
		borderWidth: 1,
		borderColor: colors.borderStrong,
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: fontSize.input,
		color: colors.textBody,
		backgroundColor: colors.surface
	},
	stepInput: {
		flex: 1,
		marginRight: 6
	},
	removeButton: {
		paddingHorizontal: 6,
		paddingTop: 10
	},
	removeText: {
		color: colors.danger,
		fontSize: fontSize.input
	},
	addButton: {
		padding: 12,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: colors.primary,
		borderStyle: "dashed",
		alignItems: "center",
		marginTop: 4
	},
	addButtonText: {
		color: colors.primary,
		fontWeight: fontWeight.semibold
	}
})
