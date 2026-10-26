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
import * as MediaLibrary from "expo-media-library"
import { Platform } from "react-native"
import { getSetting, setSetting } from "../db/repositories/settings"

const { StorageAccessFramework } = FileSystem

const DOWNLOADS_DIR_SETTING = "downloadsDirectoryUri"

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

/** Writes image bytes embedded in an imported recipe into persistent storage. */
export async function persistImportedImage(
	bytes: Uint8Array,
	mimeType: string
): Promise<string> {
	await ensureImagesDirExists()

	const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${imageExtension(
		mimeType
	)}`
	const destinationUri = imagesDirectory + filename
	await FileSystem.writeAsStringAsync(destinationUri, bytesToBase64(bytes), {
		encoding: FileSystem.EncodingType.Base64
	})
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

function imageExtension(mimeType: string): string {
	if (mimeType === "image/jpeg") return ".jpg"
	if (mimeType === "image/png") return ".png"
	if (mimeType === "image/webp") return ".webp"
	if (mimeType === "image/heic") return ".heic"
	if (mimeType === "image/heif") return ".heif"
	return ".bin"
}

function bytesToBase64(bytes: Uint8Array): string {
	const chunkSize = 0x8000
	let binary = ""
	for (let start = 0; start < bytes.length; start += chunkSize) {
		binary += String.fromCharCode(
			...bytes.subarray(start, start + chunkSize)
		)
	}
	return btoa(binary)
}

/**
 * Asks the user to grant access to a folder (opening the picker on the
 * public Downloads folder) and remembers the grant in settings. Returns
 * null if they back out of the picker.
 */
async function requestDownloadsDirectory(): Promise<string | null> {
	const permission =
		await StorageAccessFramework.requestDirectoryPermissionsAsync(
			StorageAccessFramework.getUriForDirectoryInRoot("Download")
		)
	if (!permission.granted) {
		return null
	}
	await setSetting(DOWNLOADS_DIR_SETTING, permission.directoryUri)
	return permission.directoryUri
}

async function writeToDirectory(
	directoryUri: string,
	filepath: string
): Promise<void> {
	const extensionMatch = filepath.match(/\.([a-zA-Z0-9]+)$/)
	const extension = extensionMatch ? extensionMatch[1].toLowerCase() : "jpg"
	const mimeType = `image/${extension === "jpg" ? "jpeg" : extension}`
	const name = `recipe-${Date.now()}`

	const base64 = await FileSystem.readAsStringAsync(filepath, {
		encoding: FileSystem.EncodingType.Base64
	})
	const destinationUri = await StorageAccessFramework.createFileAsync(
		directoryUri,
		name,
		mimeType
	)
	await FileSystem.writeAsStringAsync(destinationUri, base64, {
		encoding: FileSystem.EncodingType.Base64
	})
}

/**
 * Copies an image out of the app to somewhere the user can find it: the
 * Downloads folder on Android, the Photos library on iOS (which has no
 * user-visible Downloads folder). Returns false if the user declined the
 * permission prompt.
 */
export async function saveImageToDevice(filepath: string): Promise<boolean> {
	return Platform.OS === "ios"
		? saveImageToPhotos(filepath)
		: saveImageToDownloads(filepath)
}

/**
 * Add-only Photos access is all we need, so iOS asks for the narrower
 * "add photos" permission rather than full library read access. The OS only
 * prompts the first time; later calls resolve immediately.
 */
async function saveImageToPhotos(filepath: string): Promise<boolean> {
	const permission = await MediaLibrary.requestPermissionsAsync(true)
	if (!permission.granted) {
		return false
	}
	await MediaLibrary.saveToLibraryAsync(filepath)
	return true
}

/**
 * Expo Go can't write to shared storage directly, so this goes through the
 * Storage Access Framework: the first save shows the system folder picker
 * (opened on Downloads), and the granted folder URI is persisted so every
 * later save is instant. If that grant has since been revoked (app data
 * cleared, folder deleted), the write fails and we re-prompt once.
 */
async function saveImageToDownloads(filepath: string): Promise<boolean> {
	const cached = await getSetting(DOWNLOADS_DIR_SETTING)
	if (cached) {
		try {
			await writeToDirectory(cached, filepath)
			return true
		} catch {
			// Fall through and ask for the folder again.
		}
	}

	const directoryUri = await requestDownloadsDirectory()
	if (!directoryUri) {
		return false
	}
	await writeToDirectory(directoryUri, filepath)
	return true
}
