import {
	ComponentRef,
	createContext,
	PropsWithChildren,
	useContext
} from "react"
import Animated, { AnimatedRef } from "react-native-reanimated"

/**
 * Ref to an Animated.ScrollView. At runtime the underlying ScrollView
 * instance is what gets forwarded, so this also serves as a plain scroll ref.
 */
export type AnimatedScrollViewRef = AnimatedRef<
	ComponentRef<typeof Animated.ScrollView>
>

const ScrollableRefContext = createContext<AnimatedScrollViewRef | null>(null)

/**
 * Publishes the enclosing KeyboardAwareScrollView's animated ref so nested
 * sortable lists can find it.
 *
 * A context rather than a prop because DirectionsEditor sits two levels below
 * the screen root.
 */
export function ScrollableRefProvider({
	scrollableRef,
	children
}: PropsWithChildren<{ scrollableRef: AnimatedScrollViewRef }>) {
	return (
		<ScrollableRefContext.Provider value={scrollableRef}>
			{children}
		</ScrollableRefContext.Provider>
	)
}

/**
 * Returns undefined (not null) outside a provider, since that's what
 * sortables' optional `scrollableRef` prop expects — auto-scroll simply
 * stays off.
 */
export function useScrollableRef() {
	return useContext(ScrollableRefContext) ?? undefined
}
