import { useRef } from "react"
import {
	Keyboard,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View
} from "react-native"
import DraggableFlatList, {
	ScaleDecorator
} from "react-native-draggable-flatlist"
import { useRowKeys } from "../hooks/useRowKeys"
import { colors } from "../theme/colors"
import { fontSize, fontWeight } from "../theme/typography"
import { joinDirectionSteps, splitDirectionSteps } from "../utils/directions"
import { DragHandle } from "./DragHandle"

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
	const stepKeys = useRowKeys("direction-step")
	// Keyed by row key rather than index so the refs survive a reorder.
	const inputRefs = useRef<Record<string, TextInput | null>>({})
	const steps = splitDirectionSteps(directions)
	const keys = stepKeys.sync(steps.length)
	const rows: StepRow[] = steps.map((step, index) => ({
		key: keys[index],
		step
	}))

	/**
	 * Enter moves down the list instead of inserting a newline (the inputs stay
	 * multiline so long steps still wrap). On the last step there is nowhere to
	 * go, so it closes the keyboard.
	 */
	function focusNextStep(index: number | undefined) {
		if (typeof index === "number") {
			const nextKey = keys[index + 1]
			const nextInput = nextKey ? inputRefs.current[nextKey] : undefined
			if (nextInput) {
				nextInput.focus()
			} else {
				Keyboard.dismiss()
			}
		}
	}

	function updateStep(index: number | undefined, text: string) {
		if (typeof index === "number") {
			const next = [...steps]
			next[index] = text
			onChange(joinDirectionSteps(next))
		}
	}

	// splitDirectionSteps("") returns [""], so there is always at least one
	// row. Removing the last remaining step therefore drops to [] and comes
	// back as [""] on the next render, minting a fresh key and remounting the
	// single empty row. Harmless, but it looks odd in a debugger.
	function removeStep(index: number | undefined) {
		if (typeof index === "number") {
			stepKeys.remove(index)
			onChange(joinDirectionSteps(steps.filter((_, i) => i !== index)))
		}
	}

	function addStep() {
		onChange(joinDirectionSteps([...steps, ""]))
	}

	function applyStepOrder(orderedRows: StepRow[]) {
		const order = stepKeys.applyOrder(orderedRows.map((row) => row.key))
		if (!order) return
		onChange(joinDirectionSteps(order.map((index) => steps[index])))
	}

	function incrementIndex(idx: number | undefined): number {
		if (typeof idx === "number") {
			return idx + 1
		} else {
			return 1
		}
	}

	return (
		<View>
			<DraggableFlatList
				data={rows}
				keyExtractor={(row) => row.key}
				// The list is fully expanded inside the screen's scroll view,
				// so it never scrolls itself — and it must be marked
				// non-scrollable so the keyboard controller attributes focused
				// inputs to the enclosing KeyboardAwareScrollView (its native
				// parent-scroll-view lookup skips scroll-disabled lists) and
				// autoscrolls it.
				scrollEnabled={false}
				renderItem={({ item, getIndex, drag }) => (
					<ScaleDecorator>
						<View style={styles.row}>
							<DragHandle drag={drag} />
							<Text style={styles.stepNumber}>
								{incrementIndex(getIndex())}.
							</Text>
							<TextInput
								ref={(input) => {
									if (input) {
										inputRefs.current[item.key] = input
									} else {
										delete inputRefs.current[item.key]
									}
								}}
								style={[styles.input, styles.stepInput]}
								value={item.step}
								onChangeText={(text) =>
									updateStep(getIndex(), text)
								}
								placeholder={`Step ${incrementIndex(getIndex())}`}
								placeholderTextColor={colors.textPlaceholder}
								multiline
								// "submit" keeps the keyboard open and skips the
								// newline a multiline input would otherwise
								// insert, so onSubmitEditing can hand focus on.
								submitBehavior="submit"
								onSubmitEditing={() =>
									focusNextStep(getIndex())
								}
								returnKeyType={
									getIndex() === rows.length - 1
										? "done"
										: "next"
								}
							/>
							<Pressable
								onPress={() => removeStep(getIndex())}
								hitSlop={8}
								style={styles.removeButton}
							>
								<Text style={styles.removeText}>x</Text>
							</Pressable>
						</View>
					</ScaleDecorator>
				)}
				onDragEnd={({ data }) => applyStepOrder(data)}
			/>
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
		// No marginBottom — the grid's rowGap owns the spacing between rows.
		// A margin on the item root would double-count against it once the
		// rows are absolutely positioned.
	},
	stepNumber: {
		width: 28,
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
