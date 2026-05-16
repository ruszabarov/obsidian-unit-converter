import { Plugin, Editor } from "obsidian";
import { DEFAULT_SETTINGS, UnitConverterSettings, UnitConverterSettingTab } from "./settings";
import DestinationUnitSuggest from "./suggest/to-unit-suggest";
import { ConversionModal } from "./modal/conversion-modal";
import { createUnitConversionExtension } from "./editor/extension";
import { createMarkdownPostProcessor } from "./editor/md-post-processor";
import type { UnitCode } from "./utils/conversion";

export default class UnitConverterPlugin extends Plugin {
	settings: UnitConverterSettings = {
		...DEFAULT_SETTINGS,
		customUnits: [],
	};

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new UnitConverterSettingTab(this));

		if (this.settings.isAutosuggestEnabled) {
			this.registerEditorSuggest(new DestinationUnitSuggest(this));
		}

		this.registerMarkdownPostProcessor(createMarkdownPostProcessor(this.settings));

		this.registerEditorExtension(createUnitConversionExtension(this));

		this.addCommand({
			id: "convert-units",
			name: "Convert units",
			editorCallback: (editor: Editor) => {
				new ConversionModal(
					this.app,
					this.settings,
					(value: number, fromUnit: UnitCode, toUnit: UnitCode) => {
						const conversionString = `[${value}${fromUnit}|${toUnit}]`;
						editor.replaceSelection(conversionString);
					},
				).open();
			},
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.settings.customUnits = this.settings.customUnits ?? [];
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
