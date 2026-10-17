import * as FileSystem from "expo-file-system"
import * as Print from "expo-print"
import * as Sharing from "expo-sharing"
import { Platform } from "react-native"
import { Component, Ingredient, Recipe } from "../models/types"
import { splitDirectionSteps } from "./directions"
import { formatAmount, formatDuration } from "./format"

/**
 * Builds a printable representation of a recipe and either opens the native
 * share sheet with its generated PDF or the browser's print dialog on web.
 * Images are embedded as base64 because iOS's print WebView cannot render
 * local file URLs inside HTML.
 */
export async function exportRecipeAsPdf(
	recipe: Recipe,
	servings: number
): Promise<void> {
	const html = await formatRecipeAsPdfHtml(recipe, servings)

	if (Platform.OS === "web") {
		await Print.printAsync({ html })
		return
	}

	const { uri } = await Print.printToFileAsync({ html })
	if (!(await Sharing.isAvailableAsync())) {
		throw new Error("Sharing is unavailable on this device")
	}
	await Sharing.shareAsync(uri, {
		dialogTitle: "Export recipe as PDF",
		mimeType: "application/pdf",
		UTI: "com.adobe.pdf"
	})
}

export async function formatRecipeAsPdfHtml(
	recipe: Recipe,
	servings: number
): Promise<string> {
	const multiplier = servings / recipe.num_servings
	const prepTime = recipe.components.reduce((sum, c) => sum + c.prep_time, 0)
	const cookTime = recipe.components.reduce((sum, c) => sum + c.cook_time, 0)
	const images = await Promise.all(recipe.images.map(formatImage))

	return `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8" />
	<style>
		@page { margin: 18mm; }
		body { color: #1c1b1f; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 11pt; line-height: 1.45; }
		h1 { font-size: 25pt; line-height: 1.15; margin: 0 0 8pt; }
		h2 { border-bottom: 1px solid #d4d0d8; font-size: 17pt; margin: 24pt 0 10pt; padding-bottom: 4pt; }
		h3 { font-size: 13pt; margin: 18pt 0 6pt; }
		p { margin: 0 0 8pt; }
		.meta { color: #625b71; margin-bottom: 4pt; }
		.tags { color: #625b71; }
		.photos { display: block; margin: 16pt 0; }
		.photo { display: block; max-height: 250pt; max-width: 100%; margin: 0 auto 10pt; object-fit: contain; page-break-inside: avoid; }
		.section { page-break-inside: avoid; }
		ul, ol { margin: 4pt 0 12pt; padding-left: 20pt; }
		li { margin-bottom: 3pt; }
	</style>
</head>
<body>
	<h1>${escapeHtml(recipe.name)}</h1>
	<p class="meta">Servings: ${servings}</p>
	${recipe.tags.length > 0 ? `<p class="tags">Tags: ${escapeHtml(recipe.tags.join(", "))}</p>` : ""}
	${formatTiming(prepTime, cookTime)}
	${images.length > 0 ? `<div class="photos">${images.join("")}</div>` : ""}
	${recipe.components.map((component) => formatComponent(component, multiplier)).join("")}
</body>
</html>`
}

async function formatImage(filepath: string): Promise<string> {
	const base64 = await FileSystem.readAsStringAsync(filepath, {
		encoding: FileSystem.EncodingType.Base64
	})
	return `<img class="photo" src="data:${imageMimeType(filepath)};base64,${base64}" alt="Recipe photo" />`
}

function formatComponent(component: Component, multiplier: number): string {
	const timing = formatTiming(component.prep_time, component.cook_time)
	const equipment = component.equipment.length
		? `<h3>Equipment</h3><ul>${component.equipment.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
		: ""
	const ingredients = component.ingredients.length
		? `<h3>Ingredients</h3><ul>${component.ingredients.map((ingredient) => `<li>${escapeHtml(formatIngredient(ingredient, multiplier))}</li>`).join("")}</ul>`
		: ""
	const steps = splitDirectionSteps(component.directions)
		.map((step) => step.trim())
		.filter((step) => step.length > 0)
	const directions = steps.length
		? `<h3>Directions</h3><ol>${steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>`
		: ""

	return `<section class="section"><h2>${escapeHtml(component.name)}</h2>${timing}${equipment}${ingredients}${directions}</section>`
}

function formatIngredient(ingredient: Ingredient, multiplier: number): string {
	const amount = formatAmount(ingredient.amount * multiplier)
	const prep = ingredient.prep ? `, ${ingredient.prep}` : ""
	return [amount, ingredient.unit, ingredient.name + prep]
		.filter((part) => part.length > 0)
		.join(" ")
}

function formatTiming(prepTime: number, cookTime: number): string {
	const totalTime = prepTime + cookTime
	if (totalTime <= 0) {
		return ""
	}
	return `<p class="meta">Prep ${formatDuration(prepTime)} &middot; Cook ${formatDuration(cookTime)} &middot; Total ${formatDuration(totalTime)}</p>`
}

function imageMimeType(filepath: string): string {
	const extension = filepath.split(".").pop()?.toLowerCase()
	if (extension === "jpg" || extension === "jpeg") return "image/jpeg"
	if (extension === "png") return "image/png"
	if (extension === "webp") return "image/webp"
	if (extension === "heic" || extension === "heif") return "image/heic"
	return "image/jpeg"
}

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;")
}
