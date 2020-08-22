// eslint-disable-next-line import/no-unresolved
const { Position, Range } = require('vscode');

/* eslint-disable no-param-reassign */
const literals = [
  'boolean',
  'number',
  'string',
  'magic',
  'nowdoc',
  'array',
  'null',
  'encapsed',
  'nullkeyword'
];

// Keep only arguments that are literals
const onlyLiterals = (functionGroups, shouldApply) => {
  if (!shouldApply) {
    return functionGroups;
  }

  return functionGroups.filter(functionGroup => {
    functionGroup.args = functionGroup.args.filter(arg => literals.includes(arg.kind));

    return functionGroup.args.length > 0;
  });
};

const isInSelection = currentSelection => argument => {
  if (
    argument.start.line > currentSelection.start.line &&
    argument.end.line < currentSelection.end.line
  ) {
    return true;
  }
  if (
    argument.start.line === currentSelection.start.line &&
    argument.end.line < currentSelection.end.line
  ) {
    return argument.end.character > currentSelection.start.character;
  }
  if (
    argument.start.line === currentSelection.start.line &&
    argument.end.line === currentSelection.end.line
  ) {
    return (
      argument.start.character >= currentSelection.start.character ||
      argument.end.character <= currentSelection.end.character
    );
  }
  if (
    argument.start.line > currentSelection.start.line &&
    argument.end.line === currentSelection.end.line
  ) {
    return argument.start.character < currentSelection.end.character;
  }

  return false;
};

// Keep only arguments in current line/selection
const onlySelection = (functionGroups, activeEditor, shouldApply) => {
  if (!shouldApply) {
    return functionGroups;
  }

  const currentSelection = activeEditor.selection;
  let callback;

  if (currentSelection) {
    if (currentSelection.isEmpty) {
      const lines = [];

      activeEditor.selections.forEach(selection => {
        if (selection.isEmpty) {
          lines.push(selection.start.line);
        }
      });

      callback = argument => lines.includes(argument.start.line);
    } else {
      callback = isInSelection(currentSelection);
    }

    return functionGroups.filter(functionGroup => {
      functionGroup.args = functionGroup.args.filter(callback);

      return functionGroup.args.length > 0;
    });
  }

  return functionGroups;
};

const onlyVisibleRanges = (functionGroups, activeEditor, shouldApply) => {
  if (!shouldApply) {
    return functionGroups;
  }

  return functionGroups.filter(functionGroup => {
    functionGroup.args = functionGroup.args.filter(arg => {
      const { visibleRanges } = activeEditor;

      for (const range of visibleRanges) {
        const argRange = new Range(
          new Position(arg.start.line, arg.start.character),
          new Position(arg.end.line, arg.end.character)
        );

        if (range.contains(argRange)) {
          return true;
        }
      }

      return false;
    });

    return functionGroup.args.length > 0;
  });
};

module.exports = { onlyLiterals, onlySelection, onlyVisibleRanges };
