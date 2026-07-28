// Rewritten against the class-based expo-file-system API (default export
// as of Expo SDK 52+). The old function-style API this file originally
// used — FileSystem.documentDirectory, getInfoAsync, makeDirectoryAsync,
// copyAsync, deleteAsync — moved to a separate `expo-file-system/legacy`
// import; that's what "'documentDirectory' not found in imported
// namespace 'FileSystem'" means. If you're intentionally pinned to an
// older SDK, the one-line fix is swapping the import below for:
//   import * as FileSystem from 'expo-file-system/legacy';
// and leaving the rest of this file as it was. This version uses the new
// File/Directory/Paths classes instead, which is the forward-looking API.

import { Directory, File, Paths } from "expo-file-system"

const imagesDirectory = new Directory(Paths.document, "images")

async function ensureImagesDirExists(): Promise<void> {
	if (!imagesDirectory.exists) {
		imagesDirectory.create()
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

	const sourceFile = new File(sourceUri)
	const destinationFile = new File(imagesDirectory, filename)
	await sourceFile.copy(destinationFile)

	return destinationFile.uri
}

/**
 * Removes an image file from disk. Deleting the DB row (directly, or via a
 * recipe delete cascade) never touches the filesystem — call this
 * alongside any image/recipe delete to avoid leaking files.
 */
export async function deleteImageFile(filepath: string): Promise<void> {
	try {
		const file = new File(filepath)
		if (file.exists) {
			file.delete()
		}
	} catch {
		// Equivalent to the old { idempotent: true } — ignore if it's already gone.
	}
}
