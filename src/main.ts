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
import { Extension } from "@codemirror/state";

export default class UnitConverterPlugin extends Plugin {
	settings: UnitConverterSettings;
	private editorExtension: Extension;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new UnitConverterSettingTab(this));

		if (this.settings.isAutosuggestEnabled) {
			this.registerEditorSuggest(new DestinationUnitSuggest(this));
		}

		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				console.log("layout-change");
				this.refreshEditorExtensions();
			})
		);

		this.registerMarkdownPostProcessor(
			createMarkdownPostProcessor(this.settings)
		);

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

		this.refreshEditorExtensions();
	}

	refreshEditorExtensions() {
		// Unregister previous extension if it exists
		if (this.editorExtension) {
			this.app.workspace.updateOptions();
		}

		if (this.settings.livePreviewInEditMode) {
			this.editorExtension = createUnitConversionExtension(this);
			this.registerEditorExtension(this.editorExtension);
		}
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
		this.refreshEditorExtensions();
	}
}
