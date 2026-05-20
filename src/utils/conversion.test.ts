import { describe, expect, it } from "vitest";
import {
	CONVERSION_REGEX,
	convertValue,
	validateCustomUnit,
	type CustomUnitDefinition,
} from "./conversion";

function matchConversion(input: string): RegExpExecArray | null {
	CONVERSION_REGEX.lastIndex = 0;
	return CONVERSION_REGEX.exec(input);
}

describe("CONVERSION_REGEX", () => {
	it("matches common numeric syntax", () => {
		expect(matchConversion("[-3m|cm]")?.[1]).toBe("-3");
		expect(matchConversion("[.5m|cm]")?.[1]).toBe(".5");
		expect(matchConversion("[1.2m|cm]")?.[1]).toBe("1.2");
		expect(matchConversion("[1e3m|km]")).toMatchObject({
			1: "1e3",
			2: "m",
			3: "km",
		});
	});

	it("rejects malformed numeric syntax", () => {
		expect(matchConversion("[1.2.3m|cm]")).toBeNull();
	});
});

describe("custom units", () => {
	const customUnits: CustomUnitDefinition[] = [
		{
			abbr: "step",
			singular: "step",
			plural: "steps",
			measure: "length",
			anchorUnit: "cm",
			factor: 60,
		},
	];

	it("requires a positive finite factor", () => {
		expect(validateCustomUnit({ ...customUnits[0], factor: 0 }).isValid).toBe(false);
		expect(validateCustomUnit({ ...customUnits[0], factor: -1 }).isValid).toBe(false);
		expect(validateCustomUnit({ ...customUnits[0], factor: Number.POSITIVE_INFINITY }).isValid).toBe(
			false,
		);
	});

	it("converts custom units through built-in anchor units", () => {
		expect(convertValue(2, "step", "m", customUnits)).toBeCloseTo(1.2);
		expect(convertValue(120, "cm", "step", customUnits)).toBeCloseTo(2);
	});
});
