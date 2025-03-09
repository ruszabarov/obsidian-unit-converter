import UnitConverterPlugin from "src/editor/post-processor";
import {
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
} from "obsidian";
import convert, { Unit } from "convert-units";

interface DestinationUnitCompletion {
	label: string;
	value: string;
}

export default class DestinationUnitSuggest extends EditorSuggest<DestinationUnitCompletion> {
	constructor(plugin: UnitConverterPlugin) {
		super(plugin.app);
	}

	onTrigger(
		cursor: EditorPosition,
		editor: Editor
	): EditorSuggestTriggerInfo | null {
		const line = editor.getLine(cursor.line);
		const subString = line.substring(0, cursor.ch);

		// Match pattern [value unit|
		const match = subString.match(/\[([\d.]+)([a-zA-Z0-9\-/]+)\|$/);
		if (!match) return null;

		const [, , fromUnit] = match;

		try {
			// Verify if the fromUnit is valid
			convert().from(fromUnit as Unit);
			return {
				start: {
					line: cursor.line,
					ch: cursor.ch,
				},
				end: {
					line: cursor.line,
					ch: cursor.ch,
				},
				query: fromUnit,
			};
		} catch {
			return null;
		}
	}

	getSuggestions(context: EditorSuggestContext): DestinationUnitCompletion[] {
		const fromUnit = context.query;
		try {
			const possibilities = convert()
				.from(fromUnit as Unit)
				.possibilities();
			return possibilities.map((unit) => {
				const measure = convert().describe(unit);
				return {
					label: measure.plural.toLowerCase(),
					value: unit,
				};
			});
		} catch {
			return [];
		}
	}

	renderSuggestion(value: DestinationUnitCompletion, el: HTMLElement): void {
		el.createSpan({
			text: value.label,
		});
	}

	selectSuggestion(value: DestinationUnitCompletion): void {
		if (!this.context) return;

		const { editor, start } = this.context;

		// Insert the selected unit
		editor.replaceRange(value.value, start, {
			line: start.line,
			ch: start.ch,
		});

		// Position cursor after the inserted unit
		const cursorPos = {
			line: start.line,
			ch: start.ch + value.value.length,
		};

		// Check if the next character is a closing bracket
		const line = editor.getLine(cursorPos.line);
		if (line.length > cursorPos.ch && line[cursorPos.ch] === "]") {
			// Move cursor outside the closing bracket
			cursorPos.ch += 1;
		}

		editor.setCursor(cursorPos);
	}
}
