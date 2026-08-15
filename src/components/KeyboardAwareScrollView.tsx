import { ReactNode, Ref } from "react"
import { ScrollViewProps } from "react-native"
import {
	KeyboardAwareScrollView as KeyboardAwareScrollViewBase,
	KeyboardAwareScrollViewRef
} from "react-native-keyboard-controller"
import { useAnimatedRef } from "react-native-reanimated"
import {
	AnimatedScrollViewRef,
	ScrollableRefProvider
} from "./ScrollableRefContext"

type Props = ScrollViewProps & {
	children: ReactNode
	/**
	 * Gap between the keyboard and the caret inside the focused input — note
	 * it's measured to the caret, not to the bottom of the input.
	 */
	bottomOffset?: number
}

/**
 * react-native-keyboard-controller's KeyboardAwareScrollView, plus the animated
 * ref that nested sortable lists need.
 */
export function KeyboardAwareScrollView({
	children,
	bottomOffset = 16,
	...props
}: Props) {
	const scrollViewRef: AnimatedScrollViewRef = useAnimatedRef()

	return (
		<ScrollableRefProvider scrollableRef={scrollViewRef}>
			<KeyboardAwareScrollViewBase
				{...props}
				// The animated ref is typed against Animated.ScrollView while
				// the component declares a KeyboardAwareScrollViewRef; the
				// instance handed over at runtime is the inner
				// Reanimated.ScrollView, which is what the ref needs.
				ref={
					scrollViewRef as unknown as Ref<KeyboardAwareScrollViewRef>
				}
				bottomOffset={bottomOffset}
			>
				{children}
			</KeyboardAwareScrollViewBase>
		</ScrollableRefProvider>
	)
}
