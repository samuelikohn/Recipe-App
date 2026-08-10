import { forwardRef, useRef, useState } from "react"
import { TextInput, TextInputProps } from "react-native"

type Props = Omit<TextInputProps, "value"> & {
	value: string
	onChangeText: (text: string) => void
}

/**
 * TextInput for rows rendered inside a react-native-sortables list.
 *
 * Sortable.Grid does not render `renderItem` output into the tree directly.
 * It stashes the nodes in a store (ItemsProvider) that is only updated from a
 * useEffect, and each row subscribes to its own entry — so a new `value`
 * reaches the input one commit *after* the parent state changed. React
 * Native's controlled TextInput then writes that stale value back over the
 * native text, which drops fast keystrokes and jumps the cursor backwards.
 *
 * Keeping the text in local state makes the input authoritative while the
 * user types. The `value` prop is still honoured, but only when it changes to
 * something we did not type — an external reset — not when it is the delayed
 * echo of our own keystroke.
 */
export const SortableTextInput = forwardRef<TextInput, Props>(
	function SortableTextInput({ onChangeText, value, ...rest }, ref) {
		const [text, setText] = useState(value)
		const emittedRef = useRef(value)

		if (value !== emittedRef.current && value !== text) {
			emittedRef.current = value
			setText(value)
		}

		function handleChangeText(next: string) {
			emittedRef.current = next
			setText(next)
			onChangeText(next)
		}

		return (
			<TextInput
				{...rest}
				ref={ref}
				value={text}
				onChangeText={handleChangeText}
			/>
		)
	}
)
