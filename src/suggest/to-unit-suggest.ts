import UnitConverterPlugin from "../main";
import {
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
} from "obsidian";
import { getCompatibleUnits, isBuiltInUnit, PARTIAL_CONVERSION_REGEX } from "../utils/conversion";

interface DestinationUnitCompletion {
	label: string;
	value: string;
}

export default class DestinationUnitSuggest extends EditorSuggest<DestinationUnitCompletion> {
	constructor(private readonly plugin: UnitConverterPlugin) {
		super(plugin.app);
	}

	onTrigger(cursor: EditorPosition, editor: Editor): EditorSuggestTriggerInfo | null {
		if (!this.plugin.settings.isAutosuggestEnabled) {
			return null;
		}

		const line = editor.getLine(cursor.line);
		const subString = line.substring(0, cursor.ch);

		const match = subString.match(PARTIAL_CONVERSION_REGEX);
		if (!match) return null;

		const [, , fromUnit] = match;

		if (
			!isBuiltInUnit(fromUnit) &&
			!this.plugin.settings.customUnits.some((unit) => unit.abbr === fromUnit)
		) {
			return null;
		}

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
	}

	getSuggestions(context: EditorSuggestContext): DestinationUnitCompletion[] {
		const fromUnit = context.query;
		try {
			// Get the text after the pipe
			const line = context.editor.getLine(context.start.line);
			const toUnitPartial = line.substring(context.start.ch, context.end.ch).toLowerCase();

			const possibilities = getCompatibleUnits(fromUnit, this.plugin.settings.customUnits);

			return possibilities
				.map((unit) => {
					return {
						label: unit.plural.toLowerCase(),
						value: unit.abbr,
					};
				})
				.filter(
					(suggestion) =>
						suggestion.label.toLowerCase().includes(toUnitPartial) ||
						suggestion.value.toLowerCase().includes(toUnitPartial),
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
