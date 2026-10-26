import * as FileSystem from "expo-file-system"
import * as Sharing from "expo-sharing"
import { Platform } from "react-native"
import { Recipe } from "../models/types"

const MAGIC = new Uint8Array([0x52, 0x43, 0x50, 0x31]) // "RCP1"
const MIME_TYPE = "application/x-recipe"
const UTI = "public.data"

type RecipeFileMetadata = {
	recipe: Omit<Recipe, "images">
	images: {
		mimeType: string
		byteLength: number
	}[]
}

/**
 * Writes a self-contained recipe file and opens the system share sheet.
 *
 * File layout, version 1:
 * - 4 bytes: ASCII magic "RCP1"
 * - 4 bytes: unsigned, big-endian JSON metadata byte length
 * - N bytes: UTF-8 JSON metadata
 * - remaining bytes: each image's original bytes, in recipe image order
 *
 * Image paths are deliberately not exported: they are meaningful only on the
 * source device. Their type and length live in the metadata, while the actual
 * image data follows it as binary.
 */
export async function exportRecipeAsBinary(recipe: Recipe): Promise<void> {
	if (Platform.OS === "web") {
		throw new Error("Binary recipe export is only available on mobile")
	}
	if (!(await Sharing.isAvailableAsync())) {
		throw new Error("Sharing is unavailable on this device")
	}
	if (!FileSystem.cacheDirectory) {
		throw new Error("No cache directory is available")
	}

	const imageBytes = await Promise.all(
		recipe.images.map(async (filepath) =>
			base64ToBytes(
				await FileSystem.readAsStringAsync(filepath, {
					encoding: FileSystem.EncodingType.Base64
				})
			)
		)
	)
	const recipeMetadata: Omit<Recipe, "images"> = {
		id: recipe.id,
		name: recipe.name,
		num_servings: recipe.num_servings,
		directions: recipe.directions,
		prep_time: recipe.prep_time,
		cook_time: recipe.cook_time,
		ingredients: recipe.ingredients,
		components: recipe.components,
		tags: recipe.tags
	}
	const metadata: RecipeFileMetadata = {
		recipe: recipeMetadata,
		images: recipe.images.map((filepath, index) => ({
			mimeType: imageMimeType(filepath),
			byteLength: imageBytes[index].byteLength
		}))
	}
	const metadataBytes = new TextEncoder().encode(JSON.stringify(metadata))
	const lengthBytes = new Uint8Array(4)
	new DataView(lengthBytes.buffer).setUint32(0, metadataBytes.byteLength, false)
	const bytes = combineBytes([MAGIC, lengthBytes, metadataBytes, ...imageBytes])
	const uri = `${FileSystem.cacheDirectory}${makeFilename(recipe.name)}`

	await FileSystem.writeAsStringAsync(uri, bytesToBase64(bytes), {
		encoding: FileSystem.EncodingType.Base64
	})
	await Sharing.shareAsync(uri, {
		dialogTitle: "Export recipe file",
		mimeType: MIME_TYPE,
		UTI
	})
}

function base64ToBytes(base64: string): Uint8Array {
	const binary = atob(base64)
	const bytes = new Uint8Array(binary.length)
	for (let index = 0; index < binary.length; index++) {
		bytes[index] = binary.charCodeAt(index)
	}
	return bytes
}

function bytesToBase64(bytes: Uint8Array): string {
	const chunkSize = 0x8000
	let binary = ""
	for (let start = 0; start < bytes.length; start += chunkSize) {
		binary += String.fromCharCode(...bytes.subarray(start, start + chunkSize))
	}
	return btoa(binary)
}

function combineBytes(parts: Uint8Array[]): Uint8Array {
	const totalLength = parts.reduce((sum, part) => sum + part.byteLength, 0)
	const combined = new Uint8Array(totalLength)
	let offset = 0
	for (const part of parts) {
		combined.set(part, offset)
		offset += part.byteLength
	}
	return combined
}

function imageMimeType(filepath: string): string {
	const extension = filepath.split(".").pop()?.toLowerCase()
	if (extension === "jpg" || extension === "jpeg") return "image/jpeg"
	if (extension === "png") return "image/png"
	if (extension === "webp") return "image/webp"
	if (extension === "heic" || extension === "heif") return "image/heic"
	return "application/octet-stream"
}

function makeFilename(name: string): string {
	const stem = name
		.trim()
		.replace(/[^a-z0-9]+/gi, "-")
		.replace(/^-+|-+$/g, "")
		.toLowerCase()
	return `${stem || "recipe"}-${Date.now()}.recipe`
}
