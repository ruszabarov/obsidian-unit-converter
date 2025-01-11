import { App, Modal, Setting, DropdownComponent } from "obsidian";
import convert, { Unit, Measure } from "convert-units";

export class ConversionModal extends Modal {
	value: number;
	fromUnit: Unit;
	toUnit: Unit;
	fromUnitDropdown: DropdownComponent;
	toUnitDropdown: DropdownComponent;
	onSubmit: (value: number, fromUnit: Unit, toUnit: Unit) => void;

	constructor(
		app: App,
		onSubmit: (value: number, fromUnit: Unit, toUnit: Unit) => void
	) {
		super(app);
		this.onSubmit = onSubmit;
	}

	private getCompatibleUnits(measure: Measure): Unit[] {
		try {
			return convert().possibilities(measure);
		} catch {
			return [];
		}
	}

	private updateFromUnitDropdown(measure: Measure) {
		if (!this.fromUnitDropdown) return;

		// Reset dropdown options
		this.fromUnitDropdown.selectEl.empty();
		const compatibleUnits = this.getCompatibleUnits(measure);

		compatibleUnits.forEach((unit) => {
			const unitDesc = convert().describe(unit as Unit);
			this.fromUnitDropdown.addOption(
				unit,
				unitDesc.plural.toLowerCase()
			);
		});

		this.fromUnitDropdown.setValue(compatibleUnits[0]);
		this.fromUnit = compatibleUnits[0];
	}

	private updateToUnitDropdown(measure: Measure) {
		if (!this.toUnitDropdown) return;

		// Reset dropdown options
		this.toUnitDropdown.selectEl.empty();
		const compatibleUnits = this.getCompatibleUnits(measure);

		compatibleUnits.forEach((unit) => {
			const measure = convert().describe(unit as Unit);
			this.toUnitDropdown.addOption(unit, measure.plural.toLowerCase());
		});

		this.toUnitDropdown.setValue(compatibleUnits[0]);
		this.toUnit = compatibleUnits[0];
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

		const measures = convert().measures();
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
				dropdown.onChange((measure: Measure) => {
					this.updateFromUnitDropdown(measure);
					this.updateToUnitDropdown(measure);
				});
			});

		new Setting(measureFromContainer)
			.setName("From Unit")
			.addDropdown((dropdown) => {
				this.fromUnitDropdown = dropdown;
				const compatibleUnits = this.getCompatibleUnits(initialMeasure);

				compatibleUnits.forEach((unit) => {
					dropdown.addOption(
						unit,
						convert().describe(unit).plural.toLowerCase()
					);
				});

				dropdown.setValue(compatibleUnits[0]);
				this.fromUnit = compatibleUnits[0];

				dropdown.onChange((value: Unit) => {
					this.fromUnit = value;
				});
			});

		new Setting(contentEl).setName("To Unit").addDropdown((dropdown) => {
			this.toUnitDropdown = dropdown;
			const compatibleUnits = this.getCompatibleUnits(initialMeasure);

			compatibleUnits.forEach((unit) => {
				const measure = convert().describe(unit as Unit);
				dropdown.addOption(unit, measure.plural.toLowerCase());
			});

			dropdown.setValue(compatibleUnits[0]);
			this.toUnit = compatibleUnits[0];

			dropdown.onChange((value: Unit) => {
				this.toUnit = value;
			});
		});

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Insert")
				.setCta()
				.onClick(() => {
					if (this.value && this.fromUnit && this.toUnit) {
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
