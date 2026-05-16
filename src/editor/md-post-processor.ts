import { MarkdownPostProcessor } from "obsidian";
import type { UnitConverterSettings } from "../settings";
import { CONVERSION_REGEX, formatConversion } from "../utils/conversion";

export function createMarkdownPostProcessor(
	settings: UnitConverterSettings
): MarkdownPostProcessor {
	return (element: HTMLElement) => {
		const walker = document.createTreeWalker(
			element,
			NodeFilter.SHOW_TEXT,
			null
		);
		let node = walker.nextNode();

		while (node) {
			const text = node.nodeValue;

			if (!text) {
				node = walker.nextNode();
				continue;
			}

			const newText = text.replace(
				CONVERSION_REGEX,
				(
					match: string,
					valueStr: string,
					fromUnit: string,
					toUnit: string
				) => {
					const value = parseFloat(valueStr);
					return formatConversion(
						value,
						fromUnit,
						toUnit,
						settings.useDescriptiveNames,
						settings.showOriginalUnits,
						settings.customUnits
					);
				}
			);

			if (newText !== text) {
				node.nodeValue = newText;
			}

			node = walker.nextNode();
		}
	};
}
