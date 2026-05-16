import { App, Modal, Setting, DropdownComponent } from "obsidian";
import type { UnitConverterSettings } from "../settings";
import {
	listMeasures,
	listUnits,
} from "../utils/conversion";
import type { MeasureCode, UnitCode } from "../utils/conversion";

export class ConversionModal extends Modal {
	value = Number.NaN;
	fromUnit: UnitCode = "";
	toUnit: UnitCode = "";
	fromUnitDropdown!: DropdownComponent;
	toUnitDropdown!: DropdownComponent;
	onSubmit: (value: number, fromUnit: UnitCode, toUnit: UnitCode) => void;

	constructor(
		app: App,
		private readonly settings: UnitConverterSettings,
		onSubmit: (value: number, fromUnit: UnitCode, toUnit: UnitCode) => void
	) {
		super(app);
		this.onSubmit = onSubmit;
	}

	private getCompatibleUnits(measure: MeasureCode) {
		return listUnits(measure, this.settings.customUnits);
	}

	private updateFromUnitDropdown(measure: MeasureCode) {
		if (!this.fromUnitDropdown) return;

		this.fromUnitDropdown.selectEl.empty();
		const compatibleUnits = this.getCompatibleUnits(measure);

		compatibleUnits.forEach((unit) => {
			this.fromUnitDropdown.addOption(
				unit.abbr,
				unit.plural.toLowerCase()
			);
		});

		this.fromUnitDropdown.setValue(compatibleUnits[0].abbr);
		this.fromUnit = compatibleUnits[0].abbr;
	}

	private updateToUnitDropdown(measure: MeasureCode) {
		if (!this.toUnitDropdown) return;

		this.toUnitDropdown.selectEl.empty();
		const compatibleUnits = this.getCompatibleUnits(measure);

		compatibleUnits.forEach((unit) => {
			this.toUnitDropdown.addOption(unit.abbr, unit.plural.toLowerCase());
		});

		this.toUnitDropdown.setValue(compatibleUnits[0].abbr);
		this.toUnit = compatibleUnits[0].abbr;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Convert units" });

		new Setting(contentEl).setName("Value").addText((text) => {
			text.setPlaceholder("Enter a number").inputEl.setAttribute(
				"type",
				"number"
			);
			text.onChange((value) => {
				this.value = parseFloat(value);
			});
		});

		const measures = listMeasures();
		const initialMeasure = measures[0];

		const measureFromContainer = contentEl.createDiv({
			cls: "measure-from-container",
		});

		new Setting(measureFromContainer)
			.setName("Measure")
			.addDropdown((dropdown) => {
				measures.forEach((measure) => {
					dropdown.addOption(measure, measure);
				});

				dropdown.setValue(initialMeasure);
				dropdown.onChange((measure) => {
					const selectedMeasure = measure as MeasureCode;
					this.updateFromUnitDropdown(selectedMeasure);
					this.updateToUnitDropdown(selectedMeasure);
				});
			});

		new Setting(measureFromContainer)
			.setName("From Unit")
			.addDropdown((dropdown) => {
				this.fromUnitDropdown = dropdown;
				const compatibleUnits = this.getCompatibleUnits(initialMeasure);

				compatibleUnits.forEach((unit) => {
					dropdown.addOption(
						unit.abbr,
						unit.plural.toLowerCase()
					);
				});

				dropdown.setValue(compatibleUnits[0].abbr);
				this.fromUnit = compatibleUnits[0].abbr;

				dropdown.onChange((value) => {
					this.fromUnit = value;
				});
			});

		new Setting(contentEl).setName("To Unit").addDropdown((dropdown) => {
			this.toUnitDropdown = dropdown;
			const compatibleUnits = this.getCompatibleUnits(initialMeasure);

			compatibleUnits.forEach((unit) => {
				dropdown.addOption(unit.abbr, unit.plural.toLowerCase());
			});

			dropdown.setValue(compatibleUnits[0].abbr);
			this.toUnit = compatibleUnits[0].abbr;

			dropdown.onChange((value) => {
				this.toUnit = value;
			});
		});

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Insert")
				.setCta()
				.onClick(() => {
					if (
						Number.isFinite(this.value) &&
						this.fromUnit &&
						this.toUnit
					) {
						this.onSubmit(this.value, this.fromUnit, this.toUnit);
						this.close();
					}
				})
		);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
