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
import Animated, { useAnimatedRef } from "react-native-reanimated"
import {
	AnimatedScrollViewRef,
	ScrollableRefProvider
} from "./ScrollableRefContext"

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
 *
 * It's an Animated.ScrollView with a reanimated animated ref so nested
 * sortable lists can auto-scroll the form while dragging — sortables tracks
 * the offset via `useScrollViewOffset`, which resolves the view by tag and so
 * only works on an animated ref. The same ref doubles as the plain ref used
 * below, because Animated.ScrollView forwards the inner ScrollView instance.
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
	const scrollViewRef: AnimatedScrollViewRef = useAnimatedRef()
	const contentRef = useRef<View>(null)
	const scrollYRef = useRef(0)
	const keyboardTopRef = useRef<number | null>(null)

	const scrollFocusedInputIntoView = useCallback(() => {
		const focusedInput = (
			TextInput.State as TextInputState
		).currentlyFocusedInput?.()
		// Animated.ScrollView forwards the inner ScrollView instance, so the
		// scroll/measure methods below are present at runtime even though the
		// animated ref is typed against the Animated wrapper.
		const scrollView = scrollViewRef.current as ScrollView | null
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
		// scrollViewRef is listed because useAnimatedRef isn't recognised as a
		// ref hook by the lint rule; it's stable across renders either way.
	}, [keyboardGap, scrollViewRef])

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
		<ScrollableRefProvider scrollableRef={scrollViewRef}>
			<Animated.ScrollView
				{...props}
				ref={scrollViewRef}
				onScroll={handleScroll}
				onTouchEndCapture={handleTouchEndCapture}
				// Keep this at 16 or below: sortables' auto-scroll reads the
				// offset from scroll events, and a coarser throttle makes the
				// drag stutter.
				scrollEventThrottle={scrollEventThrottle ?? 16}
			>
				<View ref={contentRef} style={contentContainerStyle}>
					{children}
				</View>
			</Animated.ScrollView>
		</ScrollableRefProvider>
	)
}
