/* eslint-disable import/no-unresolved */
/* eslint-disable no-async-promise-executor */
/* eslint-disable no-restricted-syntax */
const vscode = require('vscode');
const { printError } = require('./printer');
const { sameNameSign } = require('./utils');

/**
 * Get the parameter name
 *
 * @param {Map<string, Array<string>>} functionDictionary
 * @param {string} functionName
 * @param {vscode.TextEditor} editor
 * @param {vscode.Position} argumentPosition
 * @param {vscode.Position} expressionPosition
 * @param {number} key integer
 * @param {string} argumentName
 */
function getParamName(
  functionDictionary,
  functionName,
  editor,
  argumentPosition,
  expressionPosition,
  key,
  argumentName
) {
  return new Promise(async (resolve, reject) => {
    let args = [];

    if (functionName && functionDictionary.has(functionName)) {
      args = functionDictionary.get(functionName);
    } else {
      const regExDef = /(?<=\(.*)((\.\.\.)?(&)?\$[a-zA-Z0-9_]+)(?=.*\))/gims;
      const signatureHelp = await vscode.commands.executeCommand(
        'vscode.executeSignatureHelpProvider',
        editor.document.uri,
        argumentPosition
      );
      const signature = signatureHelp.signatures[0];

      if (signature && signature.label) {
        try {
          args = signature.label.match(regExDef);
        } catch (err) {
          printError(err);
        }
      } else {
        // Fallback on hover command
        let argsDef = [];

        try {
          const hoverCommand = await vscode.commands.executeCommand(
            'vscode.executeHoverProvider',
            editor.document.uri,
            expressionPosition
          );
          const regEx = /(?<=@param.+)((\.\.\.)?(&)?\$[a-zA-Z0-9_]+)/gims;

          for (const hover of hoverCommand) {
            if (args.length) {
              break;
            }

            for (const content of hover.contents) {
              if (args.length) {
                break;
              }

              args = [...new Set(content.value.match(regEx))];

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
        } catch (err) {
          printError(err);
        }
      }

      if (functionName && args && args.length) {
        functionDictionary.set(functionName, args);
      }
    }

    if (args && args.length) {
      // Check if there is a rest parameter and return the parameter names in array-like style
      let hasRestParameter = false;
      let restParameterIndex = -1;
      let restParameterName = '';
      const argsLength = args.length;

      /**
       * @param {string} arg
       * @param {number} index
       */
      args = args.map((arg, index) => {
        if (arg.substr(0, 3) === '...') {
          hasRestParameter = true;
          restParameterIndex = index;
          restParameterName = arg.slice(3);

          return `${arg.slice(3)}[0]`;
        }

        return arg;
      });

      // f key is bigger than the arguments length, check if there was a rest
      // parameter before and name it appropriately
      if (key >= argsLength) {
        if (hasRestParameter) {
          args[key] = `${restParameterName}[${key - restParameterIndex}]`;
        }
      }

      if (
        args &&
        args.length &&
        args[key] &&
        vscode.workspace.getConfiguration('phpParameterHint').get('collapseHintsWhenEqual') &&
        argumentName
      ) {
        const squareBracketIndex = args[key].indexOf('[');
        const whereSquareBracket =
          squareBracketIndex === -1 ? args[key].length : squareBracketIndex;
        const dollarSignIndex = args[key].indexOf('$');

        if (args[key].substring(dollarSignIndex + 1, whereSquareBracket) === argumentName) {
          args[key] =
            args[key].substring(0, dollarSignIndex) +
            sameNameSign +
            args[key].substring(whereSquareBracket);
        }
      }

      resolve(args[key]);
      return;
    }

    reject();
  });
}

module.exports = getParamName;
