import { ReactNode, useRef, useState } from "react"
import {
	GestureResponderEvent,
	PanResponder,
	PanResponderGestureState,
	StyleSheet,
	Text,
	View
} from "react-native"
import { colors } from "../theme/colors"
import { fontSize, fontWeight } from "../theme/typography"

type RowLayout = {
	y: number
	height: number
}

type RenderItemArgs<T> = {
	item: T
	index: number
	dragHandle: ReactNode
	isDragging: boolean
}

type Props<T> = {
	items: T[]
	keyExtractor: (item: T, index: number) => string
	onReorder: (fromIndex: number, toIndex: number) => void
	renderItem: (args: RenderItemArgs<T>) => ReactNode
}

export function ReorderableList<T>({
	items,
	keyExtractor,
	onReorder,
	renderItem
}: Props<T>) {
	const containerRef = useRef<View>(null)
	const containerPageYRef = useRef(0)
	const rowLayoutsRef = useRef<Record<string, RowLayout>>({})
	const draggingIndexRef = useRef<number | null>(null)
	const itemsRef = useRef(items)
	const keyExtractorRef = useRef(keyExtractor)
	const onReorderRef = useRef(onReorder)
	const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const [draggingKey, setDraggingKey] = useState<string | null>(null)
	itemsRef.current = items
	keyExtractorRef.current = keyExtractor
	onReorderRef.current = onReorder

	function clearLongPressTimer() {
		if (!longPressTimerRef.current) return
		clearTimeout(longPressTimerRef.current)
		longPressTimerRef.current = null
	}

	function beginDrag(index: number, key: string) {
		containerRef.current?.measureInWindow((_x, y) => {
			containerPageYRef.current = y
		})
		draggingIndexRef.current = index
		setDraggingKey(key)
	}

	function endDrag() {
		clearLongPressTimer()
		draggingIndexRef.current = null
		setDraggingKey(null)
	}

	function updateDrag(pageY: number) {
		const fromIndex = draggingIndexRef.current
		if (fromIndex === null) return

		const localY = pageY - containerPageYRef.current
		const rows = itemsRef.current
			.map((item, index) => ({
				index,
				layout: rowLayoutsRef.current[
					keyExtractorRef.current(item, index)
				]
			}))
			.filter(
				(row): row is { index: number; layout: RowLayout } =>
					row.layout !== undefined
			)
			.sort((a, b) => a.layout.y - b.layout.y)

		if (rows.length === 0) return

		let toIndex = rows[rows.length - 1].index
		for (const row of rows) {
			if (localY < row.layout.y + row.layout.height / 2) {
				toIndex = row.index
				break
			}
		}

		if (toIndex === fromIndex) return
		draggingIndexRef.current = toIndex
		onReorderRef.current(fromIndex, toIndex)
	}

	function makeHandle(index: number, key: string) {
		const responder = PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponder: () => true,
			onPanResponderGrant: () => {
				longPressTimerRef.current = setTimeout(() => {
					beginDrag(index, key)
				}, 250)
			},
			onPanResponderMove: (
				_event: GestureResponderEvent,
				gestureState: PanResponderGestureState
			) => {
				updateDrag(gestureState.moveY)
			},
			onPanResponderRelease: endDrag,
			onPanResponderTerminate: endDrag,
			onShouldBlockNativeResponder: () => true
		})

		return (
			<View
				{...responder.panHandlers}
				accessibilityLabel="Drag to reorder"
				accessibilityRole="adjustable"
				style={styles.handle}
			>
				<Text style={styles.handleText}>|||</Text>
			</View>
		)
	}

	return (
		<View ref={containerRef}>
			{items.map((item, index) => {
				const key = keyExtractor(item, index)
				const isDragging = key === draggingKey
				return (
					<View
						key={key}
						onLayout={(event) => {
							rowLayoutsRef.current[key] =
								event.nativeEvent.layout
						}}
						style={isDragging ? styles.draggingRow : undefined}
					>
						{renderItem({
							item,
							index,
							dragHandle: makeHandle(index, key),
							isDragging
						})}
					</View>
				)
			})}
		</View>
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
	},
	draggingRow: {
		backgroundColor: colors.background
	}
})
