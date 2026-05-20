import { describe, expect, it, vi } from "vitest";
import DestinationUnitSuggest from "./to-unit-suggest";
import type { UnitConverterSettings } from "../settings";

vi.mock("obsidian", () => ({
	EditorSuggest: class {
		context = null;

		constructor() {}
	},
}));

function createSuggest(settings: Partial<UnitConverterSettings> = {}) {
	return new DestinationUnitSuggest({
		app: {},
		settings: {
			useDescriptiveNames: false,
			isAutosuggestEnabled: true,
			showOriginalUnits: false,
			customUnits: [],
			...settings,
		},
	} as never);
}

describe("DestinationUnitSuggest", () => {
	it("does not trigger when autosuggest is disabled", () => {
		const suggest = createSuggest({ isAutosuggestEnabled: false });
		const editor = { getLine: () => "[1m|" };

		expect(suggest.onTrigger({ line: 0, ch: 4 }, editor as never)).toBeNull();
	});

	it("uses the nearest unfinished conversion before the cursor", () => {
		const suggest = createSuggest();
		const line = "[1m|cm] [2kg|";
		const editor = { getLine: () => line };

		const trigger = suggest.onTrigger({ line: 0, ch: line.length }, editor as never);

		expect(trigger).toEqual({
			start: { line: 0, ch: 13 },
			end: { line: 0, ch: 13 },
			query: "kg",
		});
	});
});
