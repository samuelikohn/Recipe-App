import { ReactNode, useCallback, useEffect, useRef } from "react"
import {
	Keyboard,
	KeyboardEvent,
	NativeScrollEvent,
	NativeSyntheticEvent,
	ScrollView,
	ScrollViewProps,
	TextInput,
	View
} from "react-native"

type Props = ScrollViewProps & {
	children: ReactNode
	keyboardGap?: number
}

type FocusedInput = {
	measureLayout: (
		relativeToNativeComponentRef: View,
		onSuccess: (
			x: number,
			y: number,
			width: number,
			height: number
		) => void,
		onFail?: () => void
	) => void
}

type TextInputState = {
	currentlyFocusedInput?: () => FocusedInput | null
}

type MeasurableScrollView = ScrollView & {
	measureInWindow?: (
		callback: (x: number, y: number, width: number, height: number) => void
	) => void
	getScrollableNode?: () => {
		measureInWindow?: (
			callback: (
				x: number,
				y: number,
				width: number,
				height: number
			) => void
		) => void
	}
}

/**
 * ScrollView that keeps the focused TextInput visible above the keyboard.
 * It works for nested editors because it measures React Native's currently
 * focused input instead of requiring every child input to pass an onFocus.
 */
export function KeyboardAwareScrollView({
	children,
	contentContainerStyle,
	keyboardGap = 12,
	onScroll,
	onTouchEndCapture,
	scrollEventThrottle,
	...props
}: Props) {
	const scrollViewRef = useRef<ScrollView>(null)
	const contentRef = useRef<View>(null)
	const scrollYRef = useRef(0)
	const keyboardTopRef = useRef<number | null>(null)

	const scrollFocusedInputIntoView = useCallback(() => {
		const focusedInput = (
			TextInput.State as TextInputState
		).currentlyFocusedInput?.()
		const scrollView = scrollViewRef.current
		const content = contentRef.current

		if (!focusedInput || !scrollView || !content) return

		const measurableScrollView = scrollView as MeasurableScrollView
		const scrollableNode = measurableScrollView.getScrollableNode?.()
		const measureInWindow = measurableScrollView.measureInWindow
			? measurableScrollView.measureInWindow.bind(measurableScrollView)
			: scrollableNode?.measureInWindow?.bind(scrollableNode)

		if (!measureInWindow) return

		measureInWindow(
			(
				_x: number,
				scrollViewY: number,
				_width: number,
				scrollViewHeight: number
			) => {
				const keyboardTop = keyboardTopRef.current
				const visibleHeight =
					keyboardTop === null
						? scrollViewHeight
						: Math.max(0, keyboardTop - scrollViewY)

				focusedInput.measureLayout(
					content,
					(_inputX, inputY, _inputWidth, inputHeight) => {
						const scrollY = scrollYRef.current
						const inputTop = inputY
						const inputBottom = inputY + inputHeight
						const visibleTop = scrollY
						const visibleBottom = scrollY + visibleHeight

						if (inputBottom + keyboardGap > visibleBottom) {
							scrollView.scrollTo({
								y: inputBottom - visibleHeight + keyboardGap,
								animated: true
							})
						} else if (inputTop < visibleTop) {
							scrollView.scrollTo({
								y: Math.max(0, inputTop - keyboardGap),
								animated: true
							})
						}
					}
				)
			}
		)
	}, [keyboardGap])

	const scheduleScrollFocusedInputIntoView = useCallback(() => {
		setTimeout(scrollFocusedInputIntoView, 50)
	}, [scrollFocusedInputIntoView])

	useEffect(() => {
		function handleKeyboardFrame(event: KeyboardEvent) {
			keyboardTopRef.current = event.endCoordinates.screenY
			scheduleScrollFocusedInputIntoView()
		}

		const showSubscription = Keyboard.addListener(
			"keyboardDidShow",
			handleKeyboardFrame
		)
		const frameSubscription = Keyboard.addListener(
			"keyboardDidChangeFrame",
			handleKeyboardFrame
		)
		const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
			keyboardTopRef.current = null
		})

		return () => {
			showSubscription.remove()
			frameSubscription.remove()
			hideSubscription.remove()
		}
	}, [scheduleScrollFocusedInputIntoView])

	function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
		scrollYRef.current = event.nativeEvent.contentOffset.y
		onScroll?.(event)
	}

	function handleTouchEndCapture(
		event: Parameters<NonNullable<typeof onTouchEndCapture>>[0]
	) {
		onTouchEndCapture?.(event)
		scheduleScrollFocusedInputIntoView()
	}

	return (
		<ScrollView
			{...props}
			ref={scrollViewRef}
			onScroll={handleScroll}
			onTouchEndCapture={handleTouchEndCapture}
			scrollEventThrottle={scrollEventThrottle ?? 16}
		>
			<View ref={contentRef} style={contentContainerStyle}>
				{children}
			</View>
		</ScrollView>
	)
}
