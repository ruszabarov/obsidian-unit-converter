import { App, Modal, Setting, DropdownComponent } from "obsidian";
import convert, { Unit } from "convert-units";

export class ConversionModal extends Modal {
	value: number;
	fromUnit: Unit;
	toUnit: Unit;
	toUnitDropdown: DropdownComponent;
	onSubmit: (value: number, fromUnit: Unit, toUnit: Unit) => void;

	constructor(
		app: App,
		onSubmit: (value: number, fromUnit: Unit, toUnit: Unit) => void
	) {
		super(app);
		this.onSubmit = onSubmit;
	}

	private getCompatibleUnits(fromUnit: Unit): Unit[] {
		try {
			return convert().from(fromUnit).possibilities();
		} catch {
			return [];
		}
	}

	private updateToUnitDropdown(fromUnit: Unit) {
		if (!this.toUnitDropdown) return;

		// Reset dropdown options
		this.toUnitDropdown.selectEl.empty();
		const compatibleUnits = this.getCompatibleUnits(fromUnit);

		compatibleUnits.forEach((unit) => {
			const measure = convert().describe(unit as Unit);
			this.toUnitDropdown.addOption(unit, measure.plural.toLowerCase());
		});
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

		const units = convert().possibilities();
		const initialUnit = units[0];
		this.fromUnit = initialUnit;

		new Setting(contentEl).setName("From Unit").addDropdown((dropdown) => {
			units.forEach((unit) => {
				dropdown.addOption(
					unit,
					convert().describe(unit).plural.toLowerCase()
				);
			});

			dropdown.setValue(initialUnit);
			dropdown.onChange((value: Unit) => {
				this.fromUnit = value;
				this.updateToUnitDropdown(value);
			});
		});

		const compatibleUnits = this.getCompatibleUnits(initialUnit);
		this.toUnit = compatibleUnits[0];
		new Setting(contentEl).setName("To Unit").addDropdown((dropdown) => {
			this.toUnitDropdown = dropdown;
			compatibleUnits.forEach((unit) => {
				const measure = convert().describe(unit as Unit);
				dropdown.addOption(unit, measure.plural.toLowerCase());
			});

			dropdown.setValue(compatibleUnits[0]);
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
