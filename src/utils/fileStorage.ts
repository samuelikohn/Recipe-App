// Uses the legacy function-style expo-file-system API rather than the
// class-based Paths/Directory/File one. Reason: the class API in
// expo-file-system v18 (Expo SDK 53) lives at `expo-file-system/next`
// and depends on a JSI-installed `ExpoFileSystem` native module that
// Expo Go SDK 53 does NOT ship — importing it crashes at module load
// with "Cannot read property 'uri' of undefined" the first time any
// Directory/File is constructed. Once this project moves to a dev
// client (or a future SDK where the class API is stable in the main
// entry), this file can be rewritten to use it.

import * as FileSystem from "expo-file-system"

const imagesDirectory = FileSystem.documentDirectory + "images/"

async function ensureImagesDirExists(): Promise<void> {
	const info = await FileSystem.getInfoAsync(imagesDirectory)
	if (!info.exists) {
		await FileSystem.makeDirectoryAsync(imagesDirectory, {
			intermediates: true
		})
	}
}

/**
 * Copies a picked image into the app's persistent document directory and
 * returns the new, stable path to store in the `images` table.
 *
 * This matters because the URI an image picker returns often points at a
 * temporary cache location the OS is free to clear — storing that path
 * directly would mean recipe photos silently disappearing later.
 */
export async function persistPickedImage(sourceUri: string): Promise<string> {
	await ensureImagesDirExists()

	const extensionMatch = sourceUri.match(/\.[a-zA-Z0-9]+$/)
	const extension = extensionMatch ? extensionMatch[0] : ".jpg"
	const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`

	const destinationUri = imagesDirectory + filename
	await FileSystem.copyAsync({ from: sourceUri, to: destinationUri })

	return destinationUri
}

/**
 * Removes an image file from disk. Deleting the DB row (directly, or via a
 * recipe delete cascade) never touches the filesystem — call this
 * alongside any image/recipe delete to avoid leaking files.
 */
export async function deleteImageFile(filepath: string): Promise<void> {
	await FileSystem.deleteAsync(filepath, { idempotent: true })
}
