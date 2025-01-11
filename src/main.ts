import { Plugin, Editor } from "obsidian";
import convert, { Unit } from "convert-units";
import {
	DEFAULT_SETTINGS,
	UnitConverterSettings,
	UnitConverterSettingTab,
} from "./settings";
import DestinationUnitSuggest from "./suggest/to-unit-suggest";
import { ConversionModal } from "./modal/conversion-modal";

export default class UnitConverterPlugin extends Plugin {
	settings: UnitConverterSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new UnitConverterSettingTab(this));

		if (this.settings.isAutosuggestEnabled) {
			this.registerEditorSuggest(new DestinationUnitSuggest(this));
		}

		this.addCommand({
			id: "convert-units",
			name: "Convert units",
			editorCallback: (editor: Editor) => {
				new ConversionModal(
					this.app,
					(value: number, fromUnit: Unit, toUnit: Unit) => {
						const conversionString = `[${value}${fromUnit}|${toUnit}]`;
						editor.replaceSelection(conversionString);
					}
				).open();
			},
		});

		this.registerMarkdownPostProcessor((element: HTMLElement) => {
			const regex = /\[([\d.]+)([a-zA-Z0-9\-/]+)\|([a-zA-Z0-9\-/]+)\]/g;

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
						let displayUnit = toUnit;

						try {
							convertedValue = convert(value)
								.from(fromUnit)
								.to(toUnit);

							if (this.settings.useDescriptiveNames) {
								try {
									const measure = convert().describe(toUnit);
									if (measure && measure.plural) {
										displayUnit = (
											convertedValue === 1
												? measure.singular
												: measure.plural
										).toLowerCase();
									}
								} catch (e) {
									console.error(
										"Error getting descriptive name:",
										e
									);
								}
							}
						} catch (e) {
							console.error("Conversion error:", e);
							return match; // Return the original text if conversion fails
						}

						return `${convertedValue.toFixed(2)} ${displayUnit}`;
					}
				);

				if (newText !== text) {
					node.nodeValue = newText;
				}

				node = walker.nextNode();
			}
		});
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
