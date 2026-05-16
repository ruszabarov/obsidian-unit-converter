import { DropdownComponent, Notice, PluginSettingTab, Setting } from "obsidian";
import UnitConverterPlugin from "./main";
import {
	listMeasures,
	listUnits,
	validateCustomUnit,
} from "./utils/conversion";
import type {
	CustomUnitDefinition,
	MeasureCode,
} from "./utils/conversion";

export interface UnitConverterSettings {
	useDescriptiveNames: boolean;
	isAutosuggestEnabled: boolean;
	showOriginalUnits: boolean;
	customUnits: CustomUnitDefinition[];
}

export const DEFAULT_SETTINGS: UnitConverterSettings = {
	useDescriptiveNames: false,
	isAutosuggestEnabled: true,
	showOriginalUnits: false,
	customUnits: [],
};

export class UnitConverterSettingTab extends PluginSettingTab {
	plugin: UnitConverterPlugin;
	private isAddingCustomUnit = false;
	private editingCustomUnitAbbr: string | null = null;

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

		this.renderCustomUnitsSection(containerEl);
	}

	private renderCustomUnitsSection(containerEl: HTMLElement): void {
		const sectionEl = containerEl.createDiv({
			cls: "unit-converter-custom-units",
		});

		const headerEl = sectionEl.createDiv({
			cls: "unit-converter-custom-header",
		});
		const titleEl = headerEl.createDiv();
		titleEl.createEl("h2", { text: "Custom units" });
		titleEl.createEl("p", {
			text: "Add personal units to an existing measure, then use them anywhere the plugin accepts units.",
		});

		const addButton = headerEl.createEl("button", {
			text: "Add unit",
			cls: "mod-cta",
		});
		addButton.disabled = this.isAddingCustomUnit;
		addButton.addEventListener("click", () => {
			this.isAddingCustomUnit = true;
			this.editingCustomUnitAbbr = null;
			this.display();
		});

		if (this.plugin.settings.customUnits.length === 0) {
			sectionEl.createDiv({
				cls: "unit-converter-empty-state",
				text: "No custom units yet. Add one like step = 60 cm.",
			});
		} else {
			const listEl = sectionEl.createDiv({
				cls: "unit-converter-custom-list",
			});
			this.plugin.settings.customUnits.forEach((unit) => {
				this.renderCustomUnitRow(listEl, unit);
			});
		}

		if (this.isAddingCustomUnit) {
			this.renderCustomUnitForm(sectionEl);
		}
	}

	private renderCustomUnitRow(
		containerEl: HTMLElement,
		unit: CustomUnitDefinition
	): void {
		if (this.editingCustomUnitAbbr === unit.abbr) {
			this.renderCustomUnitForm(containerEl, unit);
			return;
		}

		const rowEl = containerEl.createDiv({
			cls: "unit-converter-custom-row",
		});
		const summaryEl = rowEl.createDiv({
			cls: "unit-converter-custom-summary",
		});

		summaryEl.createDiv({
			cls: "unit-converter-custom-abbr",
			text: unit.abbr,
		});
		summaryEl.createDiv({
			cls: "unit-converter-custom-equation",
			text: `1 ${unit.singular} = ${unit.factor} ${unit.anchorUnit}`,
		});
		summaryEl.createDiv({
			cls: "unit-converter-custom-meta",
			text: `${unit.plural} - ${unit.measure}`,
		});

		const actionsEl = rowEl.createDiv({
			cls: "unit-converter-custom-actions",
		});
		const editButton = actionsEl.createEl("button", { text: "Edit" });
		editButton.addEventListener("click", () => {
			this.editingCustomUnitAbbr = unit.abbr;
			this.isAddingCustomUnit = false;
			this.display();
		});

		const deleteButton = actionsEl.createEl("button", { text: "Delete" });
		deleteButton.addEventListener("click", async () => {
			this.plugin.settings.customUnits =
				this.plugin.settings.customUnits.filter(
					(customUnit) => customUnit.abbr !== unit.abbr
				);
			await this.plugin.saveSettings();
			this.display();
		});
	}

	private renderCustomUnitForm(
		containerEl: HTMLElement,
		existingUnit?: CustomUnitDefinition
	): void {
		const measures = listMeasures();
		const initialMeasure = existingUnit?.measure ?? measures[0];
		const initialAnchor =
			existingUnit?.anchorUnit ??
			this.getFirstBuiltInUnitForMeasure(initialMeasure);
		const draft: CustomUnitDefinition = {
			abbr: existingUnit?.abbr ?? "",
			singular: existingUnit?.singular ?? "",
			plural: existingUnit?.plural ?? "",
			measure: initialMeasure,
			anchorUnit: initialAnchor,
			factor: existingUnit?.factor ?? 1,
		};

		const formEl = containerEl.createDiv({
			cls: "unit-converter-custom-form",
		});
		formEl.createDiv({
			cls: "unit-converter-custom-form-title",
			text: existingUnit ? "Edit custom unit" : "Add custom unit",
		});

		new Setting(formEl).setName("Abbreviation").addText((text) => {
			text.setPlaceholder("step").setValue(draft.abbr);
			text.onChange((value) => {
				draft.abbr = value.trim();
			});
		});

		new Setting(formEl).setName("Singular name").addText((text) => {
			text.setPlaceholder("step").setValue(draft.singular);
			text.onChange((value) => {
				draft.singular = value.trim();
			});
		});

		new Setting(formEl).setName("Plural name").addText((text) => {
			text.setPlaceholder("steps").setValue(draft.plural);
			text.onChange((value) => {
				draft.plural = value.trim();
			});
		});

		let anchorDropdown: DropdownComponent | null = null;
		new Setting(formEl).setName("Measure").addDropdown((dropdown) => {
			measures.forEach((measure) => dropdown.addOption(measure, measure));
			dropdown.setValue(draft.measure);
			dropdown.onChange((value) => {
				const selectedMeasure = value as MeasureCode;
				draft.measure = selectedMeasure;
				draft.anchorUnit =
					this.getFirstBuiltInUnitForMeasure(selectedMeasure);
				if (anchorDropdown) {
					this.populateAnchorDropdown(anchorDropdown, draft);
				}
			});
		});

		new Setting(formEl)
			.setName("Equals")
			.setDesc(`1 ${draft.abbr || "unit"} equals this many anchor units.`)
			.addText((text) => {
				text.setPlaceholder("60").setValue(draft.factor.toString());
				text.inputEl.setAttribute("type", "number");
				text.inputEl.setAttribute("min", "0");
				text.inputEl.setAttribute("step", "any");
				text.onChange((value) => {
					draft.factor = Number(value);
				});
			});

		new Setting(formEl).setName("Anchor unit").addDropdown((dropdown) => {
			anchorDropdown = dropdown;
			dropdown.onChange((value) => {
				draft.anchorUnit = value;
			});
			this.populateAnchorDropdown(dropdown, draft);
		});

		const messageEl = formEl.createDiv({
			cls: "unit-converter-validation-message",
		});

		new Setting(formEl)
			.addButton((button) => {
				button
					.setButtonText("Save")
					.setCta()
					.onClick(async () => {
						const normalizedDraft = this.normalizeCustomUnit(draft);
						const validation = validateCustomUnit(
							normalizedDraft,
							this.plugin.settings.customUnits,
							existingUnit?.abbr
						);

						if (!validation.isValid) {
							messageEl.setText(validation.message ?? "");
							return;
						}

						if (existingUnit) {
							this.plugin.settings.customUnits =
								this.plugin.settings.customUnits.map((unit) =>
									unit.abbr === existingUnit.abbr
										? normalizedDraft
										: unit
								);
						} else {
							this.plugin.settings.customUnits = [
								...this.plugin.settings.customUnits,
								normalizedDraft,
							];
						}

						await this.plugin.saveSettings();
						this.isAddingCustomUnit = false;
						this.editingCustomUnitAbbr = null;
						new Notice("Custom unit saved.");
						this.display();
					});
			})
			.addButton((button) => {
				button.setButtonText("Cancel").onClick(() => {
					this.isAddingCustomUnit = false;
					this.editingCustomUnitAbbr = null;
					this.display();
				});
			});
	}

	private populateAnchorDropdown(
		dropdown: DropdownComponent,
		draft: CustomUnitDefinition
	): void {
		dropdown.selectEl.empty();
		const units = listUnits(draft.measure).filter((unit) => !unit.isCustom);
		units.forEach((unit) =>
			dropdown.addOption(
				unit.abbr,
				`${unit.plural.toLowerCase()} (${unit.abbr})`
			)
		);

		const hasCurrentUnit = units.some(
			(unit) => unit.abbr === draft.anchorUnit
		);
		if (!hasCurrentUnit) {
			draft.anchorUnit = units[0]?.abbr ?? "";
		}

		dropdown.setValue(draft.anchorUnit);
	}

	private getFirstBuiltInUnitForMeasure(measure: MeasureCode): string {
		return listUnits(measure).find((unit) => !unit.isCustom)?.abbr ?? "";
	}

	private normalizeCustomUnit(
		unit: CustomUnitDefinition
	): CustomUnitDefinition {
		return {
			abbr: unit.abbr.trim(),
			singular: unit.singular.trim(),
			plural: unit.plural.trim(),
			measure: unit.measure,
			anchorUnit: unit.anchorUnit.trim(),
			factor: unit.factor,
		};
	}
}
