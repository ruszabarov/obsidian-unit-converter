import convert from "convert-units";
import type { Measure, Unit } from "convert-units";

export type UnitCode = string;
export type MeasureCode = Measure;

export interface CustomUnitDefinition {
	abbr: UnitCode;
	singular: string;
	plural: string;
	measure: MeasureCode;
	anchorUnit: UnitCode;
	factor: number;
}

export interface UnitDescription {
	abbr: UnitCode;
	measure: MeasureCode;
	system: string;
	singular: string;
	plural: string;
	isCustom: boolean;
}

export interface CustomUnitValidationResult {
	isValid: boolean;
	message?: string;
}

const UNIT_CODE_REGEX = /^[a-zA-Z0-9\-/]+$/;

function getCustomUnit(
	unit: UnitCode,
	customUnits: CustomUnitDefinition[] = [],
): CustomUnitDefinition | undefined {
	return customUnits.find((customUnit) => customUnit.abbr === unit);
}

export function isBuiltInUnit(unit: UnitCode): boolean {
	try {
		convert().describe(unit as Unit);
		return true;
	} catch {
		return false;
	}
}

export function describeUnit(
	unit: UnitCode,
	customUnits: CustomUnitDefinition[] = [],
): UnitDescription {
	const customUnit = getCustomUnit(unit, customUnits);
	if (customUnit) {
		return {
			abbr: customUnit.abbr,
			measure: customUnit.measure,
			system: "custom",
			singular: customUnit.singular,
			plural: customUnit.plural,
			isCustom: true,
		};
	}

	const builtInUnit = convert().describe(unit as Unit);
	return {
		abbr: builtInUnit.abbr,
		measure: builtInUnit.measure,
		system: builtInUnit.system,
		singular: builtInUnit.singular,
		plural: builtInUnit.plural,
		isCustom: false,
	};
}

export function listMeasures(): MeasureCode[] {
	return convert().measures();
}

export function listUnits(
	measure?: MeasureCode,
	customUnits: CustomUnitDefinition[] = [],
): UnitDescription[] {
	const builtInUnits = convert()
		.list(measure)
		.map((unit) => ({
			abbr: unit.abbr,
			measure: unit.measure,
			system: unit.system,
			singular: unit.singular,
			plural: unit.plural,
			isCustom: false,
		}));

	const matchingCustomUnits = customUnits
		.filter((unit) => !measure || unit.measure === measure)
		.map((unit) => ({
			abbr: unit.abbr,
			measure: unit.measure,
			system: "custom",
			singular: unit.singular,
			plural: unit.plural,
			isCustom: true,
		}));

	return [...builtInUnits, ...matchingCustomUnits];
}

export function getCompatibleUnits(
	unit: UnitCode,
	customUnits: CustomUnitDefinition[] = [],
): UnitDescription[] {
	const description = describeUnit(unit, customUnits);
	return listUnits(description.measure, customUnits);
}

/**
 * Converts a value from one unit to another
 */
export function convertValue(
	value: number,
	fromUnit: UnitCode,
	toUnit: UnitCode,
	customUnits: CustomUnitDefinition[] = [],
): number {
	const fromCustomUnit = getCustomUnit(fromUnit, customUnits);
	const toCustomUnit = getCustomUnit(toUnit, customUnits);

	if (!fromCustomUnit && !toCustomUnit) {
		return convert(value)
			.from(fromUnit as Unit)
			.to(toUnit as Unit);
	}

	const fromDescription = describeUnit(fromUnit, customUnits);
	const toDescription = describeUnit(toUnit, customUnits);
	if (fromDescription.measure !== toDescription.measure) {
		throw new Error(
			`Cannot convert incompatible measures of ${fromDescription.measure} and ${toDescription.measure}`,
		);
	}

	const anchorValue = fromCustomUnit ? value * fromCustomUnit.factor : value;
	const anchorUnit = fromCustomUnit ? fromCustomUnit.anchorUnit : fromUnit;

	if (!toCustomUnit) {
		return convert(anchorValue)
			.from(anchorUnit as Unit)
			.to(toUnit as Unit);
	}

	const valueInTargetAnchor = convert(anchorValue)
		.from(anchorUnit as Unit)
		.to(toCustomUnit.anchorUnit as Unit);

	return valueInTargetAnchor / toCustomUnit.factor;
}

/**
 * Gets the display unit name based on the value and unit
 */
export function getDisplayUnit(
	value: number,
	unit: UnitCode,
	useDescriptiveNames: boolean,
	customUnits: CustomUnitDefinition[] = [],
): string {
	if (!useDescriptiveNames) {
		return unit.toString();
	}

	try {
		const measure = describeUnit(unit, customUnits);
		if (measure.plural) {
			return (value === 1 ? measure.singular : measure.plural).toLowerCase();
		}
	} catch (e) {
		console.error("Error getting descriptive name:", e);
	}

	return unit.toString();
}

/**
 * Performs unit conversion and returns the formatted result
 */
export function formatConversion(
	value: number,
	fromUnit: UnitCode,
	toUnit: UnitCode,
	useDescriptiveNames: boolean,
	showOriginalUnits: boolean,
	customUnits: CustomUnitDefinition[] = [],
	precision: number = 2,
): string {
	try {
		const convertedValue = convertValue(value, fromUnit, toUnit, customUnits);
		const displayUnit = getDisplayUnit(
			convertedValue,
			toUnit,
			useDescriptiveNames,
			customUnits,
		);

		if (!showOriginalUnits) {
			return `${convertedValue.toFixed(precision)} ${displayUnit}`;
		}
		const originalUnit = getDisplayUnit(value, fromUnit, useDescriptiveNames, customUnits);
		return `${value} ${originalUnit} (${convertedValue.toFixed(precision)} ${displayUnit})`;
	} catch (e) {
		console.error("Conversion error:", e);
		return `[${value}${fromUnit}|${toUnit}]`; // Return original format on error
	}
}

export function validateCustomUnit(
	unit: CustomUnitDefinition,
	customUnits: CustomUnitDefinition[] = [],
	originalAbbr?: UnitCode,
): CustomUnitValidationResult {
	const abbr = unit.abbr.trim();
	const singular = unit.singular.trim();
	const plural = unit.plural.trim();
	const anchorUnit = unit.anchorUnit.trim();

	if (!abbr) {
		return { isValid: false, message: "Add an abbreviation." };
	}

	if (!UNIT_CODE_REGEX.test(abbr)) {
		return {
			isValid: false,
			message: "Use only letters, numbers, hyphens, and slashes.",
		};
	}

	if (!singular || !plural) {
		return { isValid: false, message: "Add singular and plural names." };
	}

	if (!Number.isFinite(unit.factor) || unit.factor < 0) {
		return { isValid: false, message: "Factor must be 0 or greater." };
	}

	if (!isBuiltInUnit(anchorUnit)) {
		return { isValid: false, message: "Choose a built-in anchor unit." };
	}

	if (isBuiltInUnit(abbr)) {
		return {
			isValid: false,
			message: "That abbreviation is already a built-in unit.",
		};
	}

	const duplicate = customUnits.some(
		(customUnit) => customUnit.abbr === abbr && customUnit.abbr !== originalAbbr,
	);
	if (duplicate) {
		return {
			isValid: false,
			message: "That abbreviation is already used by another custom unit.",
		};
	}

	const anchorDescription = describeUnit(anchorUnit);
	if (anchorDescription.measure !== unit.measure) {
		return {
			isValid: false,
			message: "Anchor unit must belong to the selected measure.",
		};
	}

	return { isValid: true };
}

/**
 * Regular expression to match unit conversion syntax
 */
export const CONVERSION_REGEX = /\[([\d.]+)([a-zA-Z0-9\-/]+)\|([a-zA-Z0-9\-/]+)\]/g;
