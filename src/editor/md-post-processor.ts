import { MarkdownPostProcessor } from "obsidian";
import { Unit } from "convert-units";
import { UnitConverterSettings } from "../settings";
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
					fromUnit: Unit,
					toUnit: Unit
				) => {
					const value = parseFloat(valueStr);
					return formatConversion(
						value,
						fromUnit,
						toUnit,
						settings.useDescriptiveNames,
						settings.showOriginalUnits
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
