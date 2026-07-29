import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native"
import { useImagePicker } from "../hooks/useImagePicker"
import { colors } from "../theme/colors"
import { deleteImageFile } from "../utils/fileStorage"

type Props = {
	images: string[]
	onChange: (images: string[]) => void
}

/**
 * Photo grid for RecipeFormScreen: a tile per existing image plus a
 * trailing "+" tile that launches the OS image picker. Persists the picked
 * image through useImagePicker (which copies it into the app's document
 * directory) before adding to the list, so callers only ever see stable
 * filepaths.
 *
 * Removing a tile deletes the underlying file. That's safe because
 * RecipeFormScreen never resurrects removed entries — the draft state
 * simply drops them and save re-persists the current list.
 */
export function ImagePickerGrid({ images, onChange }: Props) {
	const { pickImage, picking } = useImagePicker()

	async function onAdd() {
		const filepath = await pickImage()
		if (filepath) {
			onChange([...images, filepath])
		}
	}

	function onRemove(filepath: string) {
		Alert.alert("Remove photo?", undefined, [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Remove",
				style: "destructive",
				onPress: () => {
					onChange(images.filter((i) => i !== filepath))
					deleteImageFile(filepath)
				}
			}
		])
	}

	return (
		<View style={styles.grid}>
			{images.map((filepath) => (
				<Pressable
					key={filepath}
					onLongPress={() => onRemove(filepath)}
					style={styles.tile}
				>
					<Image source={{ uri: filepath }} style={styles.image} />
				</Pressable>
			))}
			<Pressable
				onPress={onAdd}
				disabled={picking}
				style={[styles.tile, styles.addTile]}
			>
				<Text style={styles.addLabel}>{picking ? "…" : "+"}</Text>
			</Pressable>
		</View>
	)
}

const TILE_SIZE = 96

const styles = StyleSheet.create({
	grid: {
		flexDirection: "row",
		flexWrap: "wrap"
	},
	tile: {
		width: TILE_SIZE,
		height: TILE_SIZE,
		marginRight: 8,
		marginBottom: 8,
		borderRadius: 8,
		overflow: "hidden",
		backgroundColor: colors.surfaceMuted
	},
	image: {
		width: TILE_SIZE,
		height: TILE_SIZE
	},
	addTile: {
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: colors.borderDashed,
		borderStyle: "dashed"
	},
	addLabel: {
		fontSize: 28,
		color: colors.textMuted
	}
})
