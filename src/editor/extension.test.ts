import { Text } from "@codemirror/state";
import { describe, expect, it, vi } from "vitest";
import { isIgnoredMarkdownPosition } from "./extension";

vi.mock("obsidian", () => ({
	MarkdownView: class {},
}));

function positionOf(doc: Text, text: string): number {
	const position = doc.toString().indexOf(text);
	if (position === -1) {
		throw new Error(`Could not find ${text}`);
	}

	return position;
}

describe("isIgnoredMarkdownPosition", () => {
	it("allows normal markdown text", () => {
		const doc = Text.of(["normal [1m|cm]"]);
		expect(isIgnoredMarkdownPosition(doc, positionOf(doc, "[1m|cm]"))).toBe(false);
	});

	it("skips inline code", () => {
		const doc = Text.of(["normal `[1m|cm]`"]);
		expect(isIgnoredMarkdownPosition(doc, positionOf(doc, "[1m|cm]"))).toBe(true);
	});

	it("skips fenced code blocks", () => {
		const doc = Text.of(["```", "[1m|cm]", "```"]);
		expect(isIgnoredMarkdownPosition(doc, positionOf(doc, "[1m|cm]"))).toBe(true);
	});

	it("skips frontmatter", () => {
		const doc = Text.of(["---", "distance: [1m|cm]", "---", "body [2m|cm]"]);
		expect(isIgnoredMarkdownPosition(doc, positionOf(doc, "[1m|cm]"))).toBe(true);
		expect(isIgnoredMarkdownPosition(doc, positionOf(doc, "[2m|cm]"))).toBe(false);
	});
});
