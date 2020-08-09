// eslint-disable-next-line import/no-unresolved
const vscode = require('vscode');

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
const onlyLiterals = functionGroups => {
  if (vscode.workspace.getConfiguration('phpParameterHint').get('hintOnlyLiterals')) {
    return functionGroups.filter(
      functionGroup => functionGroup.args.filter(arg => literals.includes(arg.kind)).length > 0
    );
  }

  return functionGroups;
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
const onlySelection = (functionGroups, activeEditor) => {
  if (vscode.workspace.getConfiguration('phpParameterHint').get('hintOnlyLine')) {
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

      return functionGroups.filter(functionGroup => functionGroup.args.filter(callback).length > 0);
    }
  }

  return functionGroups;
};

module.exports = { onlyLiterals, onlySelection };