/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
// eslint-disable-next-line import/no-unresolved
const vscode = require('vscode');
const Commands = require('./commands');
const Parser = require('./parser');
const Hints = require('./hints');
const { printError } = require('./printer');
const getParamName = require('./parameterExtractor');
const { getPHPOnly } = require('./textExtractor');
const { sameNameSign } = require('./utils');

const hintDecorationType = vscode.window.createTextEditorDecorationType({});
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
const slowAfter = 175;
const showOnceEvery = 30;
let updateFuncId;

/**
 * This method is called when VSCode is activated
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  let timeout;
  let activeEditor = vscode.window.activeTextEditor;

  /**
   * Get the PHP code then parse it and create parameter hints
   */
  async function updateDecorations(funcId) {
    if (!activeEditor || !activeEditor.document || activeEditor.document.languageId !== 'php') {
      return;
    }

    const isEnabled = vscode.workspace.getConfiguration('phpParameterHint').get('enabled');

    if (!isEnabled) {
      activeEditor.setDecorations(hintDecorationType, []);

      return;
    }

    const text = activeEditor.document.getText();
    let phpArguments = [];

    try {
      const phpOnly = getPHPOnly(text);
      const isPhp7 = vscode.workspace.getConfiguration('phpParameterHint').get('php7');
      const parser = new Parser(isPhp7);
      parser.parse(phpOnly);
      phpArguments = parser.phpArguments;
    } catch (err) {
      printError(err);

      if (vscode.workspace.getConfiguration('phpParameterHint').get('onChange')) {
        return;
      }
    }

    if (phpArguments.length === 0) {
      activeEditor.setDecorations(hintDecorationType, []);

      return;
    }

    if (vscode.workspace.getConfiguration('phpParameterHint').get('hintOnlyLiterals')) {
      phpArguments = phpArguments.filter(argument => {
        return literals.includes(argument.kind);
      });
    }

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

          callback = argument => {
            return lines.includes(argument.start.line);
          };
        } else {
          callback = argument => {
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
              return argument.start.character >= currentSelection.start.character;
            }
            if (
              argument.start.line === currentSelection.start.line &&
              argument.end.line === currentSelection.end.line
            ) {
              return (
                argument.start.character >= currentSelection.start.character &&
                argument.end.character <= currentSelection.end.character
              );
            }
            if (
              argument.start.line > currentSelection.start.line &&
              argument.end.line === currentSelection.end.line
            ) {
              return argument.end.character <= currentSelection.end.character;
            }

            return false;
          };
        }

        phpArguments = phpArguments.filter(callback);
      }
    }

    const phpFunctions = [];
    const collapseHintsWhenEqual = vscode.workspace
      .getConfiguration('phpParameterHint')
      .get('collapseHintsWhenEqual');
    const phpArgumentsLen = phpArguments.length;
    const functionDictionary = new Map();

    for (let index = 0; index < phpArgumentsLen; index += 1) {
      if (funcId !== updateFuncId) {
        break;
      }

      const argument = phpArguments[index];

      const start = new vscode.Position(argument.start.line, argument.start.character);
      const end = new vscode.Position(argument.end.line, argument.end.character);

      let args;
      try {
        args = await getParamName(
          functionDictionary,
          argument.functionName,
          activeEditor,
          start,
          new vscode.Position(argument.expression.line, argument.expression.character),
          argument.key,
          argument.name
        );
      } catch (err) {
        printError(err);
      }

      if (args) {
        args = args.trim();
        let hint = '';

        if (collapseHintsWhenEqual && args.indexOf('$') === -1) {
          if (args === sameNameSign) {
            continue;
          } else {
            hint = ` ${args.replace(sameNameSign, '')} `;
          }
        } else {
          hint = `${args.replace('$', ' ').replace('& ', ' &')}: `;
        }

        const decorationPHP = Hints.paramHint(hint, new vscode.Range(start, end));
        phpFunctions.push(decorationPHP);

        if (funcId !== updateFuncId) {
          break;
        }

        if (phpArgumentsLen > slowAfter) {
          if (index % showOnceEvery === 0) {
            activeEditor.setDecorations(hintDecorationType, phpFunctions);
          }
        }
      }
    }

    if (funcId === updateFuncId) {
      activeEditor.setDecorations(hintDecorationType, phpFunctions);
    }
  }

  /**
   * Trigger updating decorations
   *
   * @param {number} delay integer
   */
  function triggerUpdateDecorations(delay = 1000) {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }

    updateFuncId = new Date().getTime();

    timeout = setTimeout(() => updateDecorations(updateFuncId), delay);
  }

  /**
   * Try creating hints multiple time on activation, in case intelephense
   * extension was not loaded at first
   *
   * @param {number} numberTries integer
   */
  function tryInitial(numberTries) {
    if (!numberTries) {
      setTimeout(triggerUpdateDecorations, 4000);

      return;
    }

    const intelephenseExtension = vscode.extensions.getExtension(
      'bmewburn.vscode-intelephense-client'
    );

    if (!intelephenseExtension || !intelephenseExtension.isActive) {
      setTimeout(() => tryInitial(numberTries - 1), 2000);
    } else {
      setTimeout(triggerUpdateDecorations, 4000);
    }
  }

  vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('phpParameterHint')) {
      triggerUpdateDecorations();
    }
  });

  Commands.registerCommands();

  vscode.window.onDidChangeActiveTextEditor(
    editor => {
      activeEditor = editor;

      if (editor) {
        triggerUpdateDecorations(
          vscode.workspace.getConfiguration('phpParameterHint').get('textEditorChangeDelay')
        );
      }
    },
    null,
    context.subscriptions
  );

  vscode.window.onDidChangeTextEditorSelection(
    () => {
      if (
        activeEditor &&
        vscode.workspace.getConfiguration('phpParameterHint').get('hintOnlyLine')
      ) {
        triggerUpdateDecorations(0);
      }
    },
    null,
    context.subscriptions
  );

  vscode.workspace.onDidChangeTextDocument(
    event => {
      if (
        activeEditor &&
        event.document === activeEditor.document &&
        vscode.workspace.getConfiguration('phpParameterHint').get('onChange')
      ) {
        triggerUpdateDecorations(
          vscode.workspace.getConfiguration('phpParameterHint').get('changeDelay')
        );
      }
    },
    null,
    context.subscriptions
  );

  vscode.workspace.onDidSaveTextDocument(
    () => {
      if (activeEditor && vscode.workspace.getConfiguration('phpParameterHint').get('onSave')) {
        triggerUpdateDecorations(
          vscode.workspace.getConfiguration('phpParameterHint').get('saveDelay')
        );
      }
    },
    null,
    context.subscriptions
  );

  if (activeEditor) {
    tryInitial(3);
  }
}

module.exports = {
  activate
};
