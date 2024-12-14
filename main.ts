import { Plugin, Setting, PluginSettingTab } from "obsidian";
import convert from "convert-units";

interface UnitConverterSettings {
	useDescriptiveNames: boolean;
}

const DEFAULT_SETTINGS: UnitConverterSettings = {
	useDescriptiveNames: false,
};

export default class UnitConverterPlugin extends Plugin {
	settings: UnitConverterSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new UnitConverterSettingTab(this));

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

class UnitConverterSettingTab extends PluginSettingTab {
	plugin: UnitConverterPlugin;

	constructor(plugin: UnitConverterPlugin) {
		super(plugin.app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Use descriptive unit names")
			.setDesc(
				'Display full unit names (e.g., "kilometers" instead of "km")'
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.useDescriptiveNames)
					.onChange(async (value) => {
						this.plugin.settings.useDescriptiveNames = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
