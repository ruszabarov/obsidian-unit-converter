import { describe, expect, it } from "vitest";
import { isWithinIgnoredMarkdownElement } from "./md-post-processor";

interface FakeElement {
	tagName: string;
	classList: {
		contains: (className: string) => boolean;
	};
	parentElement: FakeElement | null;
}

function createNode(tagName: string, classNames: string[] = [], parentElement: FakeElement | null = null) {
	const element: FakeElement = {
		tagName,
		classList: {
			contains: (className: string) => classNames.includes(className),
		},
		parentElement,
	};

	return { parentElement: element } as unknown as Node;
}

describe("isWithinIgnoredMarkdownElement", () => {
	it("skips text inside code and pre elements", () => {
		expect(isWithinIgnoredMarkdownElement(createNode("CODE"))).toBe(true);
		expect(isWithinIgnoredMarkdownElement(createNode("PRE"))).toBe(true);
	});

	it("skips text inside Obsidian code-related containers", () => {
		expect(isWithinIgnoredMarkdownElement(createNode("SPAN", ["cm-inline-code"]))).toBe(true);
		expect(isWithinIgnoredMarkdownElement(createNode("DIV", ["HyperMD-codeblock"]))).toBe(true);
	});

	it("allows normal markdown text", () => {
		expect(isWithinIgnoredMarkdownElement(createNode("P"))).toBe(false);
	});
});
