import * as FileSystem from "expo-file-system"
import * as Sharing from "expo-sharing"
import { Platform } from "react-native"
import { Recipe } from "../models/types"

const MAGIC = new Uint8Array([0x52, 0x43, 0x50, 0x31]) // "RCP1"
const MIME_TYPE = "application/x-recipe"
const UTI = "public.data"
const ZIP_MIME_TYPE = "application/zip"

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
	const bytes = await createRecipeBinary(recipe)
	await shareBytes(
		bytes,
		makeRecipeFilename(recipe.name),
		MIME_TYPE,
		"Export recipe file"
	)
}

/**
 * Exports the supplied recipes as separate .recipe entries in one ZIP file.
 * The entries use the same RCP1 format as individual recipe exports.
 */
export async function exportRecipesAsZip(recipes: Recipe[]): Promise<void> {
	if (recipes.length === 0) {
		throw new Error("There are no recipes to export")
	}

	const recipeFiles = await Promise.all(
		recipes.map(async (recipe) => ({
			name: makeRecipeFilename(recipe.name),
			bytes: await createRecipeBinary(recipe)
		}))
	)
	const bytes = createZip(uniqueEntryNames(recipeFiles))
	await shareBytes(
		bytes,
		`recipes-${Date.now()}.zip`,
		ZIP_MIME_TYPE,
		"Export recipes"
	)
}

async function createRecipeBinary(recipe: Recipe): Promise<Uint8Array> {
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
	new DataView(lengthBytes.buffer).setUint32(
		0,
		metadataBytes.byteLength,
		false
	)
	return combineBytes([MAGIC, lengthBytes, metadataBytes, ...imageBytes])
}

async function shareBytes(
	bytes: Uint8Array,
	filename: string,
	mimeType: string,
	dialogTitle: string
): Promise<void> {
	if (Platform.OS === "web") {
		throw new Error("Binary recipe export is only available on mobile")
	}
	if (!(await Sharing.isAvailableAsync())) {
		throw new Error("Sharing is unavailable on this device")
	}
	if (!FileSystem.cacheDirectory) {
		throw new Error("No cache directory is available")
	}
	const uri = `${FileSystem.cacheDirectory}${filename}`
	await FileSystem.writeAsStringAsync(uri, bytesToBase64(bytes), {
		encoding: FileSystem.EncodingType.Base64
	})
	await Sharing.shareAsync(uri, {
		dialogTitle,
		mimeType,
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
		binary += String.fromCharCode(
			...bytes.subarray(start, start + chunkSize)
		)
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

type ZipEntry = {
	name: string
	bytes: Uint8Array
}

/** Creates a ZIP archive with uncompressed UTF-8 entries. */
function createZip(entries: ZipEntry[]): Uint8Array {
	if (entries.length > 0xffff) {
		throw new Error("Too many recipes to export")
	}

	const localFiles: Uint8Array[] = []
	const centralDirectory: Uint8Array[] = []
	let offset = 0
	for (const entry of entries) {
		const name = new TextEncoder().encode(entry.name)
		const checksum = crc32(entry.bytes)
		const localHeader = zipLocalHeader(name, entry.bytes, checksum)
		localFiles.push(localHeader, entry.bytes)
		centralDirectory.push(
			zipCentralDirectoryHeader(name, entry.bytes, checksum, offset)
		)
		offset += localHeader.byteLength + entry.bytes.byteLength
	}

	const centralBytes = combineBytes(centralDirectory)
	const end = new Uint8Array(22)
	const view = new DataView(end.buffer)
	view.setUint32(0, 0x06054b50, true)
	view.setUint16(4, 0, true)
	view.setUint16(6, 0, true)
	view.setUint16(8, entries.length, true)
	view.setUint16(10, entries.length, true)
	view.setUint32(12, centralBytes.byteLength, true)
	view.setUint32(16, offset, true)
	view.setUint16(20, 0, true)
	return combineBytes([...localFiles, centralBytes, end])
}

function zipLocalHeader(
	name: Uint8Array,
	bytes: Uint8Array,
	checksum: number
): Uint8Array {
	const header = new Uint8Array(30 + name.byteLength)
	const view = new DataView(header.buffer)
	view.setUint32(0, 0x04034b50, true)
	view.setUint16(4, 20, true)
	view.setUint16(6, 0x0800, true)
	view.setUint16(8, 0, true)
	view.setUint32(14, checksum, true)
	view.setUint32(18, bytes.byteLength, true)
	view.setUint32(22, bytes.byteLength, true)
	view.setUint16(26, name.byteLength, true)
	view.setUint16(28, 0, true)
	header.set(name, 30)
	return header
}

function zipCentralDirectoryHeader(
	name: Uint8Array,
	bytes: Uint8Array,
	checksum: number,
	localHeaderOffset: number
): Uint8Array {
	const header = new Uint8Array(46 + name.byteLength)
	const view = new DataView(header.buffer)
	view.setUint32(0, 0x02014b50, true)
	view.setUint16(4, 20, true)
	view.setUint16(6, 20, true)
	view.setUint16(8, 0x0800, true)
	view.setUint16(10, 0, true)
	view.setUint32(16, checksum, true)
	view.setUint32(20, bytes.byteLength, true)
	view.setUint32(24, bytes.byteLength, true)
	view.setUint16(28, name.byteLength, true)
	view.setUint16(30, 0, true)
	view.setUint16(32, 0, true)
	view.setUint16(34, 0, true)
	view.setUint16(36, 0, true)
	view.setUint32(38, 0, true)
	view.setUint32(42, localHeaderOffset, true)
	header.set(name, 46)
	return header
}

function crc32(bytes: Uint8Array): number {
	let crc = 0xffffffff
	for (const byte of bytes) {
		crc ^= byte
		for (let bit = 0; bit < 8; bit++) {
			crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
		}
	}
	return (crc ^ 0xffffffff) >>> 0
}

function uniqueEntryNames(entries: ZipEntry[]): ZipEntry[] {
	const counts = new Map<string, number>()
	return entries.map((entry) => {
		const count = counts.get(entry.name) ?? 0
		counts.set(entry.name, count + 1)
		if (count === 0) return entry
		const extension = ".recipe"
		return {
			...entry,
			name: `${entry.name.slice(0, -extension.length)}-${count + 1}${extension}`
		}
	})
}

function imageMimeType(filepath: string): string {
	const extension = filepath.split(".").pop()?.toLowerCase()
	if (extension === "jpg" || extension === "jpeg") return "image/jpeg"
	if (extension === "png") return "image/png"
	if (extension === "webp") return "image/webp"
	if (extension === "heic" || extension === "heif") return "image/heic"
	return "application/octet-stream"
}

function makeRecipeFilename(name: string): string {
	const stem = name
		.trim()
		.replace(/[^a-z0-9]+/gi, "-")
		.replace(/^-+|-+$/g, "")
		.toLowerCase()
	return `${stem || "recipe"}-${Date.now()}.recipe`
}
