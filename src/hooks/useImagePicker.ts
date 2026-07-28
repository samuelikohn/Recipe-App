import { useCallback, useState } from "react"
import * as ImagePicker from "expo-image-picker"
import { persistPickedImage } from "../utils/fileStorage"

type UseImagePickerResult = {
	pickImage: () => Promise<string | null>
	picking: boolean
	error: Error | null
}

/**
 * Launches the system image picker and returns a persistent filepath ready
 * to add to a Recipe's `images` array (see utils/fileStorage.ts) — never
 * the raw temporary URI the picker itself returns. Resolves to null if the
 * user cancels the picker or denies permission.
 *
 * Note: `ImagePicker.MediaTypeOptions` below is the API as of recent Expo
 * SDKs; double check against whatever expo-image-picker version you land
 * on, since this option shape has changed across SDK releases.
 */
export function useImagePicker(): UseImagePickerResult {
	const [picking, setPicking] = useState(false)
	const [error, setError] = useState<Error | null>(null)

	const pickImage = useCallback(async (): Promise<string | null> => {
		setError(null)
		setPicking(true)

		try {
			const permission =
				await ImagePicker.requestMediaLibraryPermissionsAsync()
			if (!permission.granted) {
				setError(new Error("Photo library permission was denied."))
				return null
			}

			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				quality: 0.8
			})

			if (result.canceled || result.assets.length === 0) {
				return null
			}

			return await persistPickedImage(result.assets[0].uri)
		} catch (err) {
			const wrapped = err instanceof Error ? err : new Error(String(err))
			setError(wrapped)
			return null
		} finally {
			setPicking(false)
		}
	}, [])

	return { pickImage, picking, error }
}
