import { Plugin, MarkdownPostProcessorContext } from "obsidian";
import convert from "convert-units";

export default class UnitConverterPlugin extends Plugin {
	async onload() {
		this.registerMarkdownPostProcessor(
			(element: HTMLElement, context: MarkdownPostProcessorContext) => {
				const regex =
					/\[([\d.]+)([a-zA-Z0-9\-/]+)\|([a-zA-Z0-9\-/]+)\]/g;

				const walker = document.createTreeWalker(
					element,
					NodeFilter.SHOW_TEXT,
					null
				);
				let node = walker.nextNode();

				while (node) {
					const text = node.nodeValue;

					if (!text) {
						continue;
					}

					const newText = text.replace(
						regex,
						(match, valueStr, fromUnit, toUnit) => {
							const value = parseFloat(valueStr);
							let convertedValue: number;

							try {
								convertedValue = convert(value)
									.from(fromUnit)
									.to(toUnit);
							} catch (e) {
								console.error("Conversion error:", e);
								return match; // Return the original text if conversion fails
							}

							return `${convertedValue.toFixed(2)} ${toUnit}`;
						}
					);

					if (newText !== text) {
						node.nodeValue = newText;
					}

					node = walker.nextNode();
				}
			}
		);
	}

	onunload() {
		console.log("Unit Converter Plugin unloaded");
	}
}
