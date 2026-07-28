import { useState } from "react"
import { StyleSheet, TextInput, View } from "react-native"
import { TagChip } from "./TagChip"

type Props = {
	values: string[]
	onChange: (values: string[]) => void
	placeholder?: string
}

/**
 * Multi-tag input: shows a chip per tag with an ✕ to remove, plus a text
 * field where typing then pressing return commits a new tag. Case-preserving
 * but case-insensitively deduped so "Vegan" and "vegan" don't both stick.
 */
export function TagInput({ values, onChange, placeholder = "Add tag" }: Props) {
	const [draft, setDraft] = useState("")

	function commit() {
		const trimmed = draft.trim()
		if (!trimmed) return
		const exists = values.some(
			(v) => v.toLowerCase() === trimmed.toLowerCase()
		)
		if (!exists) onChange([...values, trimmed])
		setDraft("")
	}

	function remove(tag: string) {
		onChange(values.filter((v) => v !== tag))
	}

	return (
		<View style={styles.container}>
			<View style={styles.chipRow}>
				{values.map((tag) => (
					<TagChip
						key={tag}
						label={tag}
						onRemove={() => remove(tag)}
					/>
				))}
				<TextInput
					style={styles.input}
					value={draft}
					onChangeText={setDraft}
					onSubmitEditing={commit}
					onBlur={commit}
					placeholder={placeholder}
					placeholderTextColor="#999"
					autoCorrect={false}
					returnKeyType="done"
					blurOnSubmit={false}
				/>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 8,
		padding: 8,
		backgroundColor: "#fff"
	},
	chipRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		alignItems: "center"
	},
	input: {
		flexGrow: 1,
		minWidth: 100,
		fontSize: 14,
		paddingVertical: 4,
		paddingHorizontal: 4,
		color: "#222"
	}
})
