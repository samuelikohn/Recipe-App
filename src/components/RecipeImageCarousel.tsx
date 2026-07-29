import { useState } from "react"
import {
	Dimensions,
	FlatList,
	Image,
	NativeScrollEvent,
	NativeSyntheticEvent,
	StyleSheet,
	Text,
	View
} from "react-native"
import { colors } from "../theme/colors"
import { fontSize } from "../theme/typography"

type Props = {
	images: string[]
}

/**
 * Horizontally paged carousel of a recipe's images for RecipeDetailScreen.
 * Height fixed at a comfortable aspect ratio of the screen width so page
 * math stays trivial. Renders nothing when there are no images — the
 * caller decides whether to substitute a placeholder.
 */
export function RecipeImageCarousel({ images }: Props) {
	const [index, setIndex] = useState(0)
	const width = Dimensions.get("window").width

	if (images.length === 0) return null

	function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
		const offset = event.nativeEvent.contentOffset.x
		setIndex(Math.round(offset / width))
	}

	return (
		<View>
			<FlatList
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				data={images}
				keyExtractor={(uri) => uri}
				onMomentumScrollEnd={onScroll}
				renderItem={({ item }) => (
					<Image
						source={{ uri: item }}
						style={{ width, height: width * 0.75 }}
					/>
				)}
			/>
			{images.length > 1 ? (
				<View style={styles.counter}>
					<Text style={styles.counterText}>
						{index + 1} / {images.length}
					</Text>
				</View>
			) : null}
		</View>
	)
}

const styles = StyleSheet.create({
	counter: {
		position: "absolute",
		bottom: 8,
		right: 8,
		backgroundColor: colors.overlay,
		borderRadius: 10,
		paddingHorizontal: 8,
		paddingVertical: 2
	},
	counterText: {
		color: colors.textInverse,
		fontSize: fontSize.meta
	}
})
