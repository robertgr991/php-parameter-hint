// eslint-disable-next-line import/no-unresolved
const vscode = require('vscode');
const Commands = require('./commands');
const Parser = require('./parser');
const Hints = require('./hints');
const { printError } = require('./printer');
const getParamsNames = require('./parameterExtractor');
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
const slowAfterNrParam = 250;
const showParamsOnceEvery = 50;
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
    let phpFunctionGroups = [];

    try {
      const phpOnly = getPHPOnly(text);
      const isPhp7 = vscode.workspace.getConfiguration('phpParameterHint').get('php7');
      const parser = new Parser(isPhp7);
      parser.parse(phpOnly);
      phpFunctionGroups = parser.phpFunctionGroups;
    } catch (err) {
      printError(err);

      if (vscode.workspace.getConfiguration('phpParameterHint').get('onChange')) {
        return;
      }
    }

    if (phpFunctionGroups.length === 0) {
      activeEditor.setDecorations(hintDecorationType, []);

      return;
    }

    if (vscode.workspace.getConfiguration('phpParameterHint').get('hintOnlyLiterals')) {
      phpFunctionGroups = phpFunctionGroups.filter(phpFunctionGroup => {
        // eslint-disable-next-line no-param-reassign
        phpFunctionGroup.args = phpFunctionGroup.args.filter(arg => {
          return literals.includes(arg.kind);
        });

        return phpFunctionGroup.args.length > 0;
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

        phpFunctionGroups = phpFunctionGroups.filter(phpFunctionGroup => {
          // eslint-disable-next-line no-param-reassign
          phpFunctionGroup.args = phpFunctionGroup.args.filter(callback);

          return phpFunctionGroup.args.length > 0;
        });
      }
    }

    const phpArgumentsLen = phpFunctionGroups.reduce((accumulator, currentGroup) => {
      return accumulator + currentGroup.args.length;
    }, 0);
    let nrArgs = 0;
    const phpDecorations = [];
    const collapseHintsWhenEqual = vscode.workspace
      .getConfiguration('phpParameterHint')
      .get('collapseHintsWhenEqual');
    const phpFunctionGroupsLen = phpFunctionGroups.length;
    const functionDictionary = new Map();

    for (let index = 0; index < phpFunctionGroupsLen; index += 1) {
      if (funcId !== updateFuncId) {
        break;
      }

      const functionGroup = phpFunctionGroups[index];
      let args;

      try {
        args = await getParamsNames(functionDictionary, functionGroup, activeEditor);
      } catch (err) {
        printError(err);
      }

      if (args && args.length) {
        for (const arg of args) {
          arg.name = arg.name.trim();
          let hint = '';

          if (collapseHintsWhenEqual && arg.name.indexOf('$') === -1) {
            if (arg.name === sameNameSign) {
              continue;
            } else {
              hint = ` ${arg.name.replace(sameNameSign, '')} `;
            }
          } else {
            hint = `${arg.name.replace('$', ' ').replace('& ', ' &')}: `;
          }

          const decorationPHP = Hints.paramHint(hint, arg.range);
          phpDecorations.push(decorationPHP);
          nrArgs += 1;

          if (funcId !== updateFuncId) {
            break;
          }

          if (phpArgumentsLen > slowAfterNrParam) {
            if (nrArgs % showParamsOnceEvery === 0) {
              activeEditor.setDecorations(hintDecorationType, phpDecorations);
            }
          }
        }
      }

      if (funcId !== updateFuncId) {
        break;
      }
    }

    if (funcId === updateFuncId) {
      activeEditor.setDecorations(hintDecorationType, phpDecorations);
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
