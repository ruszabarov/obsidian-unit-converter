import { PluginSettingTab, Setting } from "obsidian";
import UnitConverterPlugin from "./main";

export interface UnitConverterSettings {
	useDescriptiveNames: boolean;
	isAutosuggestEnabled: boolean;
	showOriginalUnits: boolean;
}

export const DEFAULT_SETTINGS: UnitConverterSettings = {
	useDescriptiveNames: false,
	isAutosuggestEnabled: true,
	showOriginalUnits: false,
};

export class UnitConverterSettingTab extends PluginSettingTab {
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

		new Setting(containerEl)
			.setName("To Unit Autosuggest")
			.setDesc("Enable or disable autosuggest for destination units")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.isAutosuggestEnabled)
					.onChange(async (value) => {
						this.plugin.settings.isAutosuggestEnabled = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Show Original Units")
			.setDesc("Enable to display the original entered value in addition to the converted one")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showOriginalUnits)
					.onChange(async (value) => {
						this.plugin.settings.showOriginalUnits = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
