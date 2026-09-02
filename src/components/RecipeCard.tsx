import { Image, Pressable, StyleSheet, Text, View } from "react-native"
import { RecipeSummary } from "../models/types"
import { useThemedStyles } from "../theme/ThemeProvider"
import { ThemeColors } from "../theme/colors"
import { fontSize, fontWeight } from "../theme/typography"
import { formatDuration } from "../utils/format"
import { TagChip } from "./TagChip"

type Props = {
	recipe: RecipeSummary
	onPress: () => void
}

/**
 * Card cell for RecipeListScreen. Shows the recipe's cover image (or a
 * placeholder), name, serving count, and a short tag row. Full tag list
 * lives on RecipeDetailScreen — we cap at three chips here so cards stay
 * roughly the same height.
 */
export function RecipeCard({ recipe, onPress }: Props) {
	const styles = useThemedStyles(makeStyles)
	const visibleTags = recipe.tags.slice(0, 3)
	const extra = recipe.tags.length - visibleTags.length
	const totalTime = recipe.prep_time + recipe.cook_time

	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => [styles.card, pressed && styles.pressed]}
		>
			{recipe.coverImage ? (
				<Image
					source={{ uri: recipe.coverImage }}
					style={styles.image}
				/>
			) : (
				<View style={[styles.image, styles.placeholder]}>
					<Text style={styles.placeholderText}>No photo</Text>
				</View>
			)}
			<View style={styles.body}>
				<Text style={styles.name} numberOfLines={2}>
					{recipe.name}
				</Text>
				<Text style={styles.servings}>
					Serves {recipe.num_servings}
				</Text>
				{visibleTags.length > 0 ? (
					<View style={styles.tagRow}>
						{visibleTags.map((tag) => (
							<TagChip key={tag} label={tag} />
						))}
						{extra > 0 ? (
							<Text style={styles.moreTags}>+{extra}</Text>
						) : null}
					</View>
				) : null}
				{totalTime > 0 ? (
					<Text style={styles.timing}>
						Prep {formatDuration(recipe.prep_time)} · Cook{" "}
						{formatDuration(recipe.cook_time)} · Total{" "}
						{formatDuration(totalTime)}
					</Text>
				) : null}
			</View>
		</Pressable>
	)
}

const makeStyles = (colors: ThemeColors) =>
	StyleSheet.create({
		card: {
			flexDirection: "row",
			backgroundColor: colors.surface,
			borderRadius: 12,
			marginHorizontal: 12,
			marginVertical: 6,
			overflow: "hidden",
			borderWidth: 1,
			borderColor: colors.border
		},
		pressed: {
			opacity: 0.7
		},
		image: {
			width: 96,
			objectFit: "cover"
		},
		placeholder: {
			backgroundColor: colors.surfaceMuted,
			alignItems: "center",
			justifyContent: "center"
		},
		placeholderText: {
			fontSize: fontSize.fine,
			color: colors.textPlaceholder
		},
		body: {
			flex: 1,
			padding: 12,
			justifyContent: "center"
		},
		name: {
			fontSize: fontSize.input,
			fontWeight: fontWeight.bold,
			color: colors.textBody
		},
		servings: {
			marginTop: 2,
			fontSize: fontSize.meta,
			color: colors.textMuted
		},
		timing: {
			marginTop: 2,
			fontSize: fontSize.meta,
			color: colors.textMuted
		},
		tagRow: {
			flexDirection: "row",
			flexWrap: "wrap",
			alignItems: "center",
			marginTop: 6
		},
		moreTags: {
			fontSize: fontSize.meta,
			color: colors.textMuted,
			marginLeft: 2
		}
	})
