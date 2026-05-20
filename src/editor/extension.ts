import {
	EditorView,
	ViewPlugin,
	Decoration,
	DecorationSet,
	ViewUpdate,
	WidgetType,
} from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import type { Text } from "@codemirror/state";
import UnitConverterPlugin from "../main";
import { convertValue, formatConversion, CONVERSION_REGEX } from "../utils/conversion";
import type { UnitCode } from "../utils/conversion";
import { MarkdownView } from "obsidian";

function isFenceLine(line: string): boolean {
	return /^\s{0,3}(```|~~~)/.test(line);
}

function isInFrontmatter(doc: Text, lineNumber: number): boolean {
	if (doc.lines === 0 || doc.line(1).text.trim() !== "---") {
		return false;
	}

	for (let currentLine = 2; currentLine <= doc.lines; currentLine++) {
		if (doc.line(currentLine).text.trim() === "---") {
			return lineNumber <= currentLine;
		}
	}

	return true;
}

function isInFencedCode(doc: Text, lineNumber: number): boolean {
	let isInFence = false;

	for (let currentLine = 1; currentLine <= lineNumber; currentLine++) {
		const line = doc.line(currentLine).text;
		if (!isFenceLine(line)) {
			continue;
		}

		if (currentLine === lineNumber) {
			return true;
		}

		isInFence = !isInFence;
	}

	return isInFence;
}

function isInInlineCode(line: string, offset: number): boolean {
	const textBeforeMatch = line.slice(0, offset);
	const unescapedBackticks = textBeforeMatch.match(/(?<!\\)`/g);
	return (unescapedBackticks?.length ?? 0) % 2 === 1;
}

export function isIgnoredMarkdownPosition(doc: Text, position: number): boolean {
	const line = doc.lineAt(position);

	return (
		isInFrontmatter(doc, line.number) ||
		isInFencedCode(doc, line.number) ||
		isInInlineCode(line.text, position - line.from)
	);
}

class ConversionWidget extends WidgetType {
	constructor(
		private readonly value: number,
		private readonly fromUnit: UnitCode,
		private readonly toUnit: UnitCode,
		private readonly plugin: UnitConverterPlugin,
		private readonly view: EditorView,
		private readonly from: number,
		private readonly to: number,
	) {
		super();
	}

	toDOM(): HTMLElement {
		const span = document.createElement("span");

		span.textContent = formatConversion(
			this.value,
			this.fromUnit,
			this.toUnit,
			this.plugin.settings.useDescriptiveNames,
			this.plugin.settings.showOriginalUnits,
			this.plugin.settings.customUnits,
		);

		span.style.cursor = "pointer";

		// Make the widget selectable on click
		span.addEventListener("click", (e) => {
			e.preventDefault();

			// Set selection to cover the entire text
			this.view.dispatch({
				selection: {
					anchor: this.from + 1,
					head: this.to - 1,
				},
			});
		});

		return span;
	}
}

export function createUnitConversionExtension(plugin: UnitConverterPlugin) {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;
			isLivePreview: boolean = false;

			constructor(view: EditorView) {
				this.isLivePreview = this.detectEditorMode(view);
				this.decorations = this.buildDecorations(view);
			}

			detectEditorMode(editorView: EditorView): boolean {
				const sourceView = editorView.dom.closest(".markdown-source-view");
				if (sourceView) {
					return sourceView.classList.contains("is-live-preview");
				}

				const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
				if (!view) return false;

				const currentMode = view.currentMode;
				return "sourceMode" in currentMode && !currentMode.sourceMode;
			}

			update(update: ViewUpdate) {
				const newMode = this.detectEditorMode(update.view);
				const modeChanged = newMode !== this.isLivePreview;

				if (
					update.docChanged ||
					update.selectionSet ||
					update.viewportChanged ||
					modeChanged
				) {
					this.isLivePreview = newMode;
					this.decorations = this.buildDecorations(update.view);
				}
			}

			buildDecorations(view: EditorView) {
				if (!this.isLivePreview) {
					return Decoration.none;
				}

				const builder = new RangeSetBuilder<Decoration>();
				const cursorPos = view.state.selection.main.head;
				const cursorLine = view.state.doc.lineAt(cursorPos).number;

				for (const { from, to } of view.visibleRanges) {
					const text = view.state.doc.sliceString(from, to);
					let match;

					CONVERSION_REGEX.lastIndex = 0;
					while ((match = CONVERSION_REGEX.exec(text)) !== null) {
						const start = from + match.index;
						const end = start + match[0].length;
						const lineAtMatch = view.state.doc.lineAt(start).number;

						// Apply decoration if we're not on the active line
						if (
							lineAtMatch !== cursorLine &&
							!isIgnoredMarkdownPosition(view.state.doc, start)
						) {
							const value = parseFloat(match[1]);
							const fromUnit = match[2];
							const toUnit = match[3];

							try {
								convertValue(value, fromUnit, toUnit, plugin.settings.customUnits);

								builder.add(
									start,
									end,
									Decoration.replace({
										widget: new ConversionWidget(
											value,
											fromUnit,
											toUnit,
											plugin,
											view,
											start,
											end,
										),
									}),
								);
							} catch (e) {
								console.debug("Invalid conversion:", e);
							}
						}
					}
				}

				return builder.finish();
			}
		},
		{
			decorations: (v) => v.decorations,
		},
	);
}
