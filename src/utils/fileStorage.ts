// Uses the class-based expo-file-system API (Directory / File / Paths).
// In expo-file-system v18 (the version shipped with Expo SDK 53) these
// classes live at `expo-file-system/next` — the main entry still only
// exports the legacy `documentDirectory`, `getInfoAsync`, etc.  In a
// later major release the classes were promoted to the main export;
// when this project upgrades past that boundary, drop the `/next`
// subpath below. Getting this wrong crashes on import with
// "Cannot read property 'document' of undefined" because `Paths` is
// undefined and this module reads `Paths.document` at top level.

import { Directory, File, Paths } from "expo-file-system/next"

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
