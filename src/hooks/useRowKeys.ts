import { useRef } from "react"

/**
 * Stable row keys for lists whose items have no identity of their own —
 * ingredient rows (no id), direction steps (plain strings that can repeat or
 * be blank), and unsaved components (all share `id: 0`).
 *
 * react-native-sortables needs a key per row that survives edits and
 * reorders, so the keys live in an array kept parallel to the data array.
 * Callers keep the two aligned by calling `remove` when they delete a row and
 * `applyOrder` when a drag reorders rows; `sync` is the only repair path for
 * drift (first render, or the data changing from outside).
 *
 * Keys are minted from a monotonic counter and never reused, so a removed row
 * can't be confused with a later one that happens to land in the same slot.
 */
export function useRowKeys(prefix: string) {
	const counterRef = useRef(0)
	const keysRef = useRef<string[]>([])

	/**
	 * Call once per render with the current item count. Appends fresh keys
	 * when the list has grown and truncates from the tail when it has shrunk.
	 * Idempotent for a fixed count, so a StrictMode double render is harmless
	 * — the counter only advances when growing. Treat the result as read-only.
	 */
	function sync(count: number): string[] {
		const keys = keysRef.current
		while (keys.length < count) {
			keys.push(`${prefix}-${counterRef.current++}`)
		}
		// Truncate in place so the array keeps a stable identity.
		keys.length = count
		return keys
	}

	function remove(index: number) {
		keysRef.current.splice(index, 1)
	}

	/**
	 * Turns a reordered key array back into a permutation of the previous
	 * positions and adopts the new order. Returns null when the keys don't
	 * match the ones we currently hold, so a stale drag result is ignored
	 * rather than scrambling the data.
	 */
	function applyOrder(nextKeys: string[]): number[] | null {
		if (nextKeys.length !== keysRef.current.length) return null
		const order = nextKeys.map((key) => keysRef.current.indexOf(key))
		if (order.some((index) => index < 0)) return null
		keysRef.current = nextKeys
		return order
	}

	return { applyOrder, remove, sync }
}
