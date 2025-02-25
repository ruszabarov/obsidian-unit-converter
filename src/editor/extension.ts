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
} from "../utils/conversion";

type EditorMode = "source" | "live-preview";

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
			currentEditorMode: EditorMode = "source";

			constructor(view: EditorView) {
				this.currentEditorMode = this.detectEditorMode(view);
				this.decorations = this.buildDecorations(view);
			}

			detectEditorMode(view: EditorView): EditorMode {
				const editorElement = view.dom.closest(
					".markdown-source-view.mod-cm6"
				);
				return editorElement?.classList.contains("is-live-preview")
					? "live-preview"
					: "source";
			}

			update(update: ViewUpdate) {
				const newMode = this.detectEditorMode(update.view);
				const modeChanged = newMode !== this.currentEditorMode;

				if (
					update.docChanged ||
					update.selectionSet ||
					update.viewportChanged ||
					modeChanged
				) {
					this.currentEditorMode = newMode;
					this.decorations = this.buildDecorations(update.view);
				}
			}

			buildDecorations(view: EditorView) {
				if (
					!plugin.settings.livePreviewInEditMode ||
					this.currentEditorMode === "source"
				) {
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
							const value = parseFloat(match[1]);
							const fromUnit = match[2] as Unit;
							const toUnit = match[3] as Unit;

							try {
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
