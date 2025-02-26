import {
	EditorView,
	ViewPlugin,
	Decoration,
	DecorationSet,
	ViewUpdate,
	WidgetType,
} from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { Unit } from "convert-units";
import UnitConverterPlugin from "../main";
import {
	convertValue,
	formatConversion,
	CONVERSION_REGEX,
	parseFractionalNotation,
} from "../utils/conversion";
import { MarkdownView } from "obsidian";

class ConversionWidget extends WidgetType {
	constructor(
		private readonly value: number,
		private readonly fromUnit: Unit,
		private readonly toUnit: Unit,
		private readonly plugin: UnitConverterPlugin
	) {
		super();
	}

	toDOM(): HTMLElement {
		const span = document.createElement("span");

		span.textContent = formatConversion(
			this.value,
			this.fromUnit,
			this.toUnit,
			this.plugin.settings.useDescriptiveNames
		);

		return span;
	}
}

export function createUnitConversionExtension(plugin: UnitConverterPlugin) {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;
			isLivePreview: boolean = false;

			constructor(view: EditorView) {
				this.isLivePreview = this.detectEditorMode();
				this.decorations = this.buildDecorations(view);
			}

			detectEditorMode(): boolean {
				const view =
					plugin.app.workspace.getActiveViewOfType(MarkdownView);

				if (!view) return false;

				const currentMode = view.currentMode;
				return "sourceMode" in currentMode && !currentMode.sourceMode;
			}

			update(update: ViewUpdate) {
				const newMode = this.detectEditorMode();
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

					while ((match = CONVERSION_REGEX.exec(text)) !== null) {
						const start = from + match.index;
						const end = start + match[0].length;
						const lineAtMatch = view.state.doc.lineAt(start).number;

						// Apply decoration if we're not on the active line
						if (lineAtMatch !== cursorLine) {
							const valueStr = match[1];
							const fromUnit = match[2] as Unit;
							const toUnit = match[3] as Unit;

							try {
								const value = parseFractionalNotation(
									valueStr,
									fromUnit
								);
								convertValue(value, fromUnit, toUnit);

								builder.add(
									start,
									end,
									Decoration.replace({
										widget: new ConversionWidget(
											value,
											fromUnit,
											toUnit,
											plugin
										),
									})
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
		}
	);
}
