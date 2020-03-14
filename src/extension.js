const vscode = require('vscode');
const Commands = require('./commands');
const Parser = require('./parser');
const Hints = require('./hints');

const hintDecorationType = vscode.window.createTextEditorDecorationType({});
const channel = vscode.window.createOutputChannel('PHP Parameter Hint');
const sameNameSign = '%';
const literals = ['boolean', 'number', 'string', 'magic', 'nowdoc', 'array', 'null', 'encapsed'];
const slowAfter = 150;
const showOnceEvery = 20;
let updateFuncId;

/**
 * Print an error
 * @param {string} err
 */
function printError(err) {
  channel.appendLine(new Date().toLocaleString() + ` Error: ${err}`);
}

/**
 * Get the parameter name
 *
 * @param {vscode.TextEditor} editor
 * @param {vscode.Position} position
 * @param {number} key integer
 * @param {string} argumentName
 */
function getParamName(editor, position, key, argumentName) {
  return new Promise(async (resolve, reject) => {
    let args = [];
    const hoverCommand = await vscode.commands.executeCommand(
      'vscode.executeHoverProvider',
      editor.document.uri,
      position
    );

    if (hoverCommand && hoverCommand.length) {
      try {
        const regEx = /(?<=@param.+)((\.\.\.)?(&)?\$[a-zA-Z0-9_]+)/gims;
        let isFound = false;

        for (let hover of hoverCommand) {
          if (isFound) {
            break;
          }

          for (let content of hover.contents) {
            if (isFound) {
              break;
            }

            args = [...new Set(content.value.match(regEx))];

            if (args) {
              isFound = true;
            }
          }
        }

        if (args && args.length) {
          if (
            vscode.workspace.getConfiguration('phpParameterHint').get('collapseHintsWhenEqual') &&
            args[key] &&
            argumentName &&
            args[key].substring(args[key].indexOf('$') + 1) === argumentName
          ) {
            args[key] = args[key].substring(0, args[key].indexOf('$')) + sameNameSign;
          }
        }
      } catch (err) {
        printError(err);
      }
    }

    if (args && args.length) {
      resolve(args[key]);
    }

    reject();
  });
}

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
    const phpOpenTags = ['<?php', '<?=', '<?'];
    const phpCloseTag = '?>';

    try {
      const phpOnly = getPHPOnly(text, phpOpenTags, phpCloseTag);
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

    for (let index = 0; index < phpArgumentsLen; index++) {
      var argument = phpArguments[index];

      const start = new vscode.Position(argument.start.line, argument.start.character);
      const end = new vscode.Position(argument.end.line, argument.end.character);

      let args;
      try {
        args = await getParamName(
          activeEditor,
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
          hint =
            args
              .replace('$', ' ')
              .replace('... ', ' ...')
              .replace('& ', ' &') + ': ';
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
   * Return only text containing php code, rest of the text is converted to *spaces
   *
   * @param {string} text
   * @param {array} phpOpenTags
   * @param {string} phpCloseTag
   */
  function getPHPOnly(text, phpOpenTags, phpCloseTag) {
    let phpOnly = '';
    const lastEnd = 0;

    while (true) {
      let startIndex = Infinity;
      let currentOpenTag = '';

      phpOpenTags.forEach(tag => {
        const tmpIndex = text.indexOf(tag);

        if (tmpIndex !== -1 && tmpIndex < startIndex) {
          startIndex = tmpIndex;
          currentOpenTag = tag;
        }
      });

      if (startIndex === Infinity) {
        break;
      }

      phpOnly += text.substring(lastEnd, startIndex).replace(/[^\n\t\r]{1}/g, ' ');
      text = text.substring(startIndex);

      startIndex = 0;
      const endIndex = text.indexOf(phpCloseTag);

      if (endIndex === -1) {
        phpOnly += text
          .substring(startIndex)
          .replace(currentOpenTag, ' '.repeat(currentOpenTag.length));
        break;
      } else {
        const closeTagReplace = ';' + ' '.repeat(phpCloseTag.length - 1);

        phpOnly += text
          .substring(startIndex, endIndex + phpCloseTag.length)
          .replace(currentOpenTag, ' '.repeat(currentOpenTag.length))
          .replace(phpCloseTag, closeTagReplace);
        text = text.substring(endIndex + phpCloseTag.length);
      }
    }

    return phpOnly;
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

    if (!intelephenseExtension) {
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
