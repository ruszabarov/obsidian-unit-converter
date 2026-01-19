import convert, { Unit } from "convert-units";

/**
 * Converts a value from one unit to another
 */
export function convertValue(
	value: number,
	fromUnit: Unit,
	toUnit: Unit
): number {
	return convert(value).from(fromUnit).to(toUnit);
}

/**
 * Gets the display unit name based on the value and unit
 */
export function getDisplayUnit(
	value: number,
	unit: Unit,
	useDescriptiveNames: boolean
): string {
	if (!useDescriptiveNames) {
		return unit.toString();
	}

	try {
		const measure = convert().describe(unit);
		if (measure && measure.plural) {
			return (
				value === 1 ? measure.singular : measure.plural
			).toLowerCase();
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
	fromUnit: Unit,
	toUnit: Unit,
	useDescriptiveNames: boolean,
	showOriginalUnits: boolean,
	precision: number = 2
): string {
	try {
		const convertedValue = convertValue(value, fromUnit, toUnit);
		const displayUnit = getDisplayUnit(
			convertedValue,
			toUnit,
			useDescriptiveNames
		);

		if (!showOriginalUnits) {
			return `${convertedValue.toFixed(precision)} ${displayUnit}`;
		}
		const originalUnit = getDisplayUnit(value,fromUnit,useDescriptiveNames);
		return `${value} ${originalUnit} (${convertedValue.toFixed(precision)} ${displayUnit})`;
	} catch (e) {
		console.error("Conversion error:", e);
		return `[${value}${fromUnit}|${toUnit}]`; // Return original format on error
	}
}

/**
 * Regular expression to match unit conversion syntax
 */
export const CONVERSION_REGEX =
	/\[([\d.]+)([a-zA-Z0-9\-/]+)\|([a-zA-Z0-9\-/]+)\]/g;
