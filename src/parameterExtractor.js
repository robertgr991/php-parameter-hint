/* eslint-disable import/no-unresolved */
const vscode = require('vscode');
const { printError } = require('./printer');
const { sameNameSign } = require('./utils');

/**
 * Get the parameter name
 *
 * @param {Map<string, Array<string>>} functionDictionary
 * @param {Object} functionGroup
 * @param {vscode.TextEditor} editor
 */
function getParamsNames(functionDictionary, functionGroup, editor) {
  return new Promise(async (resolve, reject) => {
    const finalArgs = [];
    let args = [];
    const collapseHintsWhenEqual = vscode.workspace
      .getConfiguration('phpParameterHint')
      .get('collapseHintsWhenEqual');

    if (functionGroup.name && functionDictionary.has(functionGroup.name)) {
      args = functionDictionary.get(functionGroup.name);
    } else {
      const regExDef = /(?<=\(.*)((\.\.\.)?(&)?\$[a-zA-Z0-9_]+)(?=.*\))/gims;
      let signature;
      const signatureHelp = await vscode.commands.executeCommand(
        'vscode.executeSignatureHelpProvider',
        editor.document.uri,
        new vscode.Position(functionGroup.args[0].start.line, functionGroup.args[0].start.character)
      );

      if (signatureHelp) {
        [signature] = signatureHelp.signatures;
      }

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
            new vscode.Position(functionGroup.line, functionGroup.character)
          );
          const regEx = /(?<=@param.+)((\.\.\.)?(&)?\$[a-zA-Z0-9_]+)/gims;

          if (hoverCommand) {
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
          }
        } catch (err) {
          printError(err);
        }
      }

      if (functionGroup.name && args && args.length) {
        functionDictionary.set(functionGroup.name, args);
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

      for (let index = 0; index < functionGroup.args.length; index += 1) {
        if (index === argsLength && !hasRestParameter) {
          break;
        }

        const groupArg = functionGroup.args[index];
        const arg = args[index] || '';
        const finalArg = {};
        const groupArgStart = new vscode.Position(groupArg.start.line, groupArg.start.character);
        const groupArgEnd = new vscode.Position(groupArg.end.line, groupArg.end.character);

        finalArg.range = new vscode.Range(groupArgStart, groupArgEnd);
        finalArg.name = arg;

        // If key is bigger than the arguments length, check if there was a rest
        // parameter before and name it appropriately
        if (index >= argsLength) {
          finalArg.name = `${restParameterName}[${index - restParameterIndex}]`;
        }

        if (collapseHintsWhenEqual && groupArg.name) {
          const squareBracketIndex = finalArg.name.indexOf('[');
          const whereSquareBracket =
            squareBracketIndex === -1 ? finalArg.name.length : squareBracketIndex;
          const dollarSignIndex = finalArg.name.indexOf('$');

          if (finalArg.name.substring(dollarSignIndex + 1, whereSquareBracket) === groupArg.name) {
            finalArg.name =
              finalArg.name.substring(0, dollarSignIndex) +
              sameNameSign +
              finalArg.name.substring(whereSquareBracket);
          }
        }

        finalArgs.push(finalArg);
      }

      resolve(finalArgs);
      return;
    }

    reject();
  });
}

module.exports = getParamsNames;
