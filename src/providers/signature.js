// eslint-disable-next-line import/no-unresolved
const vscode = require('vscode');
const { printError } = require('../printer');
const { getDocRegex } = require('./regex');

const getArgs = async (editor, line, character, showTypes) => {
  let signature;
  const signatureHelp = await vscode.commands.executeCommand(
    'vscode.executeSignatureHelpProvider',
    editor.document.uri,
    new vscode.Position(line, character)
  );

  if (signatureHelp) {
    [signature] = signatureHelp.signatures;
  }

  if (signature && signature.parameters) {
    try {
      return signature.parameters.map(parameter => {
        const regExDoc = getDocRegex(showTypes);
        /**
         * If there is a phpDoc for the parameter, use it as the doc
         * provides more types
         */
        if (parameter.documentation && parameter.documentation.value) {
          const docLabel = new RegExp(regExDoc.source, 'gims')
            .exec(parameter.documentation.value)[1]
            .replace('`', '')
            .trim();

          /**
           * Doc wrongfully shows variadic param type as array so we remove it
           */
          return docLabel.indexOf('[]') !== -1 && docLabel.indexOf('...') !== -1
            ? docLabel.replace('[]', '')
            : docLabel;
        }

        // Fallback to label
        const splittedLabel = parameter.label.split(' ');

        if (showTypes === 'disabled') {
          return splittedLabel[0];
        }

        /**
         * For cases with default param, like: '$glue = ""',
         * take only the param name
         */
        return splittedLabel[0].indexOf('$') !== -1
          ? splittedLabel[0]
          : splittedLabel.slice(0, 2).join(' ');
      });
    } catch (err) {
      printError(err);
      return [];
    }
  }

  return [];
};

module.exports = {
  getArgs
};
