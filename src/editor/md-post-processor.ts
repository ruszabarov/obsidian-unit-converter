import type { MarkdownPostProcessor } from "obsidian";
import type UnitConverterPlugin from "../main";
import { CONVERSION_REGEX, formatConversion } from "../utils/conversion";

export function isWithinIgnoredMarkdownElement(node: Node): boolean {
	let element = node.parentElement;

	while (element) {
		if (element.tagName === "CODE" || element.tagName === "PRE") {
			return true;
		}

		if (
			element.classList.contains("HyperMD-codeblock") ||
			element.classList.contains("cm-inline-code") ||
			element.classList.contains("frontmatter")
		) {
			return true;
		}

		element = element.parentElement;
	}

	return false;
}

export function createMarkdownPostProcessor(plugin: UnitConverterPlugin): MarkdownPostProcessor {
	return (element: HTMLElement) => {
		const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
		let node = walker.nextNode();

		while (node) {
			const text = node.nodeValue;

			if (!text || isWithinIgnoredMarkdownElement(node)) {
				node = walker.nextNode();
				continue;
			}

			CONVERSION_REGEX.lastIndex = 0;
			const newText = text.replace(
				CONVERSION_REGEX,
				(match: string, valueStr: string, fromUnit: string, toUnit: string) => {
					const value = parseFloat(valueStr);
					return formatConversion(
						value,
						fromUnit,
						toUnit,
						plugin.settings.useDescriptiveNames,
						plugin.settings.showOriginalUnits,
						plugin.settings.customUnits,
					);
				},
			);

			if (newText !== text) {
				node.nodeValue = newText;
			}

			node = walker.nextNode();
		}
	};
}
