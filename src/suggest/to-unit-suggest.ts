import UnitConverterPlugin from "../main";
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

		// Match pattern [value unit| or [value unit|text
		const match = subString.match(
			/\[([\d.]+)([a-zA-Z0-9\-/]+)\|([a-zA-Z0-9-]*)/
		);
		if (!match) return null;

		const [, , fromUnit] = match;

		try {
			// Verify if the fromUnit is valid
			convert().from(fromUnit as Unit);

			// Find the start position of the toUnit part (after the pipe)
			const pipeIndex = subString.lastIndexOf("|");

			return {
				start: {
					line: cursor.line,
					ch: pipeIndex + 1,
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
			// Get the text after the pipe
			const line = context.editor.getLine(context.start.line);
			const toUnitPartial = line
				.substring(context.start.ch, context.end.ch)
				.toLowerCase();

			const possibilities = convert()
				.from(fromUnit as Unit)
				.possibilities();

			// Filter possibilities based on what the user has typed
			return possibilities
				.map((unit) => {
					const measure = convert().describe(unit);
					return {
						label: measure.plural.toLowerCase(),
						value: unit,
					};
				})
				.filter(
					(suggestion) =>
						suggestion.label
							.toLowerCase()
							.includes(toUnitPartial) ||
						suggestion.value.toLowerCase().includes(toUnitPartial)
				);
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

		const { editor, start, end } = this.context;

		// Replace the partial text with the selected unit
		editor.replaceRange(value.value, start, end);

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
		} else if (line.length > cursorPos.ch && line[cursorPos.ch] !== "]") {
			// If there's no closing bracket, add one
			editor.replaceRange("]", cursorPos, cursorPos);
			cursorPos.ch += 1;
		} else {
			// If we're at the end of the line, add a closing bracket
			editor.replaceRange("]", cursorPos, cursorPos);
			cursorPos.ch += 1;
		}

		editor.setCursor(cursorPos);
	}
}
