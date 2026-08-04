import { Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import Sortable from "react-native-sortables"
import { useRowKeys } from "../hooks/useRowKeys"
import { colors } from "../theme/colors"
import { fontSize, fontWeight } from "../theme/typography"
import { joinDirectionSteps, splitDirectionSteps } from "../utils/directions"
import { DragHandle } from "./DragHandle"
import { useScrollableRef } from "./ScrollableRefContext"

type Props = {
	directions: string
	onChange: (directions: string) => void
}

type StepRow = {
	key: string
	step: string
}

/**
 * Numbered-step editor. The stored value is still a single newline-joined
 * text field; this component presents it as step rows that can be reordered
 * by holding their grip and dragging.
 *
 * Steps are plain strings, so they carry no identity of their own (two blank
 * steps are indistinguishable). useRowKeys supplies the stable per-row keys
 * the sortable list needs.
 */
export function DirectionsEditor({ directions, onChange }: Props) {
	const scrollableRef = useScrollableRef()
	const stepKeys = useRowKeys("direction-step")
	const steps = splitDirectionSteps(directions)
	const keys = stepKeys.sync(steps.length)
	const rows: StepRow[] = steps.map((step, index) => ({
		key: keys[index],
		step
	}))

	function updateStep(index: number, text: string) {
		const next = [...steps]
		next[index] = text
		onChange(joinDirectionSteps(next))
	}

	// splitDirectionSteps("") returns [""], so there is always at least one
	// row. Removing the last remaining step therefore drops to [] and comes
	// back as [""] on the next render, minting a fresh key and remounting the
	// single empty row. Harmless, but it looks odd in a debugger.
	function removeStep(index: number) {
		stepKeys.remove(index)
		onChange(joinDirectionSteps(steps.filter((_, i) => i !== index)))
	}

	function addStep() {
		onChange(joinDirectionSteps([...steps, ""]))
	}

	function applyStepOrder(orderedRows: StepRow[]) {
		const order = stepKeys.applyOrder(orderedRows.map((row) => row.key))
		if (!order) return
		onChange(joinDirectionSteps(order.map((index) => steps[index])))
	}

	return (
		<View>
			<Sortable.Layer>
				<Sortable.Grid
					columns={1}
					rowGap={8}
					data={rows}
					keyExtractor={(row) => row.key}
					renderItem={({ item, index }) => (
						<View style={styles.row}>
							<DragHandle />
							<Text style={styles.stepNumber}>{index + 1}.</Text>
							<TextInput
								style={[styles.input, styles.stepInput]}
								value={item.step}
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
								<Text style={styles.removeText}>x</Text>
							</Pressable>
						</View>
					)}
					onDragEnd={({ data }) => applyStepOrder(data)}
					customHandle
					hapticsEnabled
					sortEnabled={rows.length > 1}
					scrollableRef={scrollableRef}
					// A multi-line step is much taller than a one-line
					// neighbour, and the default "center" origin feels
					// sluggish when dragging a tall row.
					reorderTriggerOrigin="touch"
					activeItemScale={1.02}
					inactiveItemOpacity={1}
					itemEntering={null}
					itemExiting={null}
				/>
			</Sortable.Layer>
			<Pressable onPress={addStep} style={styles.addButton}>
				<Text style={styles.addButtonText}>+ Add step</Text>
			</Pressable>
		</View>
	)
}

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		alignItems: "flex-start"
		// No marginBottom — the grid's rowGap owns the spacing between rows.
		// A margin on the item root would double-count against it once the
		// rows are absolutely positioned.
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
