import { Plugin, Editor } from "obsidian";
import { Unit } from "convert-units";
import {
	DEFAULT_SETTINGS,
	UnitConverterSettings,
	UnitConverterSettingTab,
} from "./settings";
import DestinationUnitSuggest from "./suggest/to-unit-suggest";
import { ConversionModal } from "./modal/conversion-modal";
import { createUnitConversionExtension } from "./editor/extension";
import { createMarkdownPostProcessor } from "./editor/md-post-processor";

export default class UnitConverterPlugin extends Plugin {
	settings: UnitConverterSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new UnitConverterSettingTab(this));

		if (this.settings.isAutosuggestEnabled) {
			this.registerEditorSuggest(new DestinationUnitSuggest(this));
		}

		this.registerMarkdownPostProcessor(
			createMarkdownPostProcessor(this.settings)
		);

		this.registerEditorExtension(createUnitConversionExtension(this));

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
