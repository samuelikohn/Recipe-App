import { Ionicons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import {
	Alert,
	Image,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	ToastAndroid
} from "react-native"
import DraggableFlatList, {
	ScaleDecorator
} from "react-native-draggable-flatlist"
import { useImagePicker } from "../hooks/useImagePicker"
import { useTheme, useThemedStyles } from "../theme/ThemeProvider"
import { ThemeColors } from "../theme/colors"
import { fontSize, fontWeight } from "../theme/typography"
import { deleteImageFile, saveImageToDevice } from "../utils/fileStorage"

type Props = {
	images: string[]
	onChange: (images: string[]) => void
}

/**
 * Photo strip for RecipeFormScreen: a tile per existing image plus a
 * trailing "+" tile that launches the OS image picker. Persists the picked
 * image through useImagePicker (which copies it into the app's document
 * directory) before adding to the list, so callers only ever see stable
 * filepaths.
 *
 * Holding a tile picks it up for a drag reorder; the "x" badge in its corner
 * is the way to remove one. The download badge in the opposite corner
 * copies the photo out of the app — to Downloads on Android, to the Photos
 * library on iOS. The tiles lay out as a single horizontally
 * scrolling row rather than a wrapping grid because the sortable list only
 * reorders along one axis.
 *
 * Filepaths are unique per pick (useImagePicker copies each selection to a
 * fresh name), so they double as the list's row keys — no separate identity
 * bookkeeping needed here.
 *
 * Removing a tile deletes the underlying file. That's safe because
 * RecipeFormScreen never resurrects removed entries — the draft state
 * simply drops them and save re-persists the current list.
 */
export function ImagePickerGrid({ images, onChange }: Props) {
	const { pickImage, picking } = useImagePicker()
	const styles = useThemedStyles(makeStyles)
	const { colors } = useTheme()

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

	async function onDownload(filepath: string) {
		try {
			const saved = await saveImageToDevice(filepath)
			if (!saved) {
				return
			}
			// iOS has no toast; a success haptic confirms without making
			// the user dismiss anything.
			if (Platform.OS === "ios") {
				Haptics.notificationAsync(
					Haptics.NotificationFeedbackType.Success
				)
			} else {
				ToastAndroid.show("Saved to Downloads", ToastAndroid.SHORT)
			}
		} catch {
			Alert.alert("Couldn't save photo")
		}
	}

	return (
		<DraggableFlatList
			data={images}
			horizontal
			keyExtractor={(filepath) => filepath}
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.strip}
			renderItem={({ item: filepath, drag, isActive }) => (
				<ScaleDecorator>
					<Pressable
						onLongPress={drag}
						delayLongPress={500}
						disabled={isActive}
						style={styles.tile}
					>
						<Image
							source={{ uri: filepath }}
							style={styles.image}
						/>
						<Pressable
							onPress={() => onDownload(filepath)}
							hitSlop={8}
							accessibilityLabel="Download photo"
							style={[styles.badge, styles.downloadButton]}
						>
							<Ionicons
								name="download-outline"
								size={14}
								color={colors.textInverse}
							/>
						</Pressable>
						<Pressable
							onPress={() => onRemove(filepath)}
							hitSlop={8}
							accessibilityLabel="Remove photo"
							style={[styles.badge, styles.removeButton]}
						>
							<Text style={styles.removeText}>✕</Text>
						</Pressable>
					</Pressable>
				</ScaleDecorator>
			)}
			onDragEnd={({ data }) => onChange(data)}
			ListFooterComponent={
				<Pressable
					onPress={onAdd}
					disabled={picking}
					style={[styles.tile, styles.addTile]}
				>
					<Text style={styles.addLabel}>{picking ? "…" : "+"}</Text>
				</Pressable>
			}
		/>
	)
}

const TILE_SIZE = 96

const makeStyles = (colors: ThemeColors) =>
	StyleSheet.create({
		// Must not fix a width: the FlatList sizes its scrollable content from
		// this style, and the sortable list clamps a dragged tile to that
		// content extent. Pinning it to one tile both killed scrolling and
		// forced every lifted tile to snap to the first slot.
		strip: {
			paddingBottom: 8
		},
		tile: {
			width: TILE_SIZE,
			height: TILE_SIZE,
			marginRight: 8,
			borderRadius: 8,
			backgroundColor: colors.surfaceMuted
		},
		image: {
			width: TILE_SIZE,
			height: TILE_SIZE,
			borderRadius: 8
		},
		badge: {
			position: "absolute",
			top: 4,
			width: 22,
			height: 22,
			borderRadius: 11,
			alignItems: "center",
			justifyContent: "center",
			backgroundColor: colors.overlay
		},
		downloadButton: {
			left: 4
		},
		removeButton: {
			right: 4
		},
		removeText: {
			color: colors.textInverse,
			fontSize: fontSize.input,
			fontWeight: fontWeight.semibold,
			// The glyph sits low in its line box at this size; nudging it up
			// keeps it centered in the circle.
			lineHeight: fontSize.input,
			marginTop: -1
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
