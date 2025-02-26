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
 * Parse fractional notation like "1-1/2" or "1-2-3/4" to decimal
 * Handles these formats:
 * - "1-1/2" = 1.5 (1 + 1/2)
 * - "1-1-1/2" = 13.5 (1 foot 1 inch + 1/2 inch)
 * - "7-0-1/2" = 84.5 (7 feet 0 inches + 1/2 inch)
 */
export function parseFractionalNotation(
	notation: string,
	unit: string
): number {
	// If it's a simple number, return it
	if (!notation.includes("-")) {
		return parseFloat(notation);
	}

	// Check if we're dealing with feet-inches notation or just fractional inches
	const parts = notation.split("-");

	if (parts.length === 2) {
		// Format: whole-fraction (e.g., "1-1/2")
		const whole = parseFloat(parts[0]);
		const fraction = evaluateFraction(parts[1]);
		return whole + fraction;
	} else if (parts.length === 3 && unit.toLowerCase().includes("ft")) {
		// Format: feet-inches-fraction (e.g., "7-0-1/2ft")
		const feet = parseFloat(parts[0]);
		const inches = parseFloat(parts[1]);
		const fraction = evaluateFraction(parts[2]);
		return feet * 12 + inches + fraction; // Convert to inches first
	} else if (parts.length === 3 && unit.toLowerCase().includes("in")) {
		// Format: feet-inches-fraction (e.g., "1-1-1/2in")
		const feet = parseFloat(parts[0]);
		const inches = parseFloat(parts[1]);
		const fraction = evaluateFraction(parts[2]);
		return feet * 12 + inches + fraction; // Convert to inches
	}

	// Fall back to parsing as float if we can't interpret the notation
	return parseFloat(notation.replace(/-/g, "."));
}

/**
 * Evaluates a fraction string like "1/2" to its decimal value
 */
function evaluateFraction(fraction: string): number {
	if (!fraction.includes("/")) {
		return parseFloat(fraction);
	}

	const [numerator, denominator] = fraction.split("/").map(parseFloat);
	if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
		return 0;
	}

	return numerator / denominator;
}

/**
 * Performs unit conversion and returns the formatted result
 */
export function formatConversion(
	value: number,
	fromUnit: Unit,
	toUnit: Unit,
	useDescriptiveNames: boolean,
	precision: number = 2
): string {
	try {
		const convertedValue = convertValue(value, fromUnit, toUnit);
		const displayUnit = getDisplayUnit(
			convertedValue,
			toUnit,
			useDescriptiveNames
		);
		return `${convertedValue.toFixed(precision)} ${displayUnit}`;
	} catch (e) {
		console.error("Conversion error:", e);
		return `[${value}${fromUnit}|${toUnit}]`; // Return original format on error
	}
}

/**
 * Regular expression to match unit conversion syntax
 * Updated to match fractional notation like [1-1/2in|mm] or [7-0-1/2ft|in]
 */
export const CONVERSION_REGEX =
	/\[([\d.\-/]+)([a-zA-Z0-9\-/]+)\|([a-zA-Z0-9\-/]+)\]/g;
