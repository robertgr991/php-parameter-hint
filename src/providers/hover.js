// eslint-disable-next-line import/no-unresolved
const vscode = require('vscode');
const { printError } = require('../printer');
const { getDocRegex, getDefRegex } = require('./regex');

const getArgs = async (editor, line, character, showTypes) => {
  let argsDef = [];
  let args = [];
  const regExDoc = getDocRegex(showTypes);
  const regExDef = getDefRegex(showTypes);

  try {
    const hoverCommand = await vscode.commands.executeCommand(
      'vscode.executeHoverProvider',
      editor.document.uri,
      new vscode.Position(line, character)
    );

    if (hoverCommand) {
      for (const hover of hoverCommand) {
        if (args.length) {
          break;
        }

        for (const content of hover.contents) {
          if (args.length) {
            break;
          }

          args = [
            ...new Set(content.value.match(regExDoc).map(label => label.replace('`', '').trim()))
          ];

          // If no parameters annotations found, try a regEx that takes the
          // parameters from the function definition in hover content
          if (!argsDef.length) {
            argsDef = [...new Set(content.value.match(regExDef))];
          }
        }
      }

      if (!args || !args.length) {
        args = argsDef;
      }
    }
  } catch (err) {
    printError(err);
    return [];
  }

  return args;
};

module.exports = {
  getArgs
};
