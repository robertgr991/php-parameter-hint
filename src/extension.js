/* eslint-disable */
const vscode = require('vscode');
const Commands = require('./commands');
const Parser = require('./parser');
const Hints = require('./hints');

const hintDecorationType = vscode.window.createTextEditorDecorationType({});
const channel = vscode.window.createOutputChannel('PHP Parameter Hint');

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
 */
function getParamName(editor, position, key) {
  return new Promise(async (resolve, reject) => {
    var args = [];
    var hoverCommand = await vscode.commands.executeCommand(
      'vscode.executeHoverProvider',
      editor.document.uri,
      position
    );

    if (hoverCommand && hoverCommand.length > 0) {
      try {
        const regEx = /(?<=@param.+)((\.\.\.)?(&)?\$[a-zA-Z0-9_]+)/g;
        args = hoverCommand[0].contents[0].value.match(regEx);
      } catch (err) {
        printError(err);
      }
    }

    if (args) {
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
  let timeout = undefined;
  let activeEditor = vscode.window.activeTextEditor;

  /**
   * Get the PHP code then parse it and create parameter hints
   */
  async function updateDecorations() {
    if (!activeEditor || !activeEditor.document || activeEditor.document.languageId !== 'php') {
      return;
    }

    const isEnabled = vscode.workspace.getConfiguration('phpParameterHint').get('enabled');

    if (!isEnabled) {
      activeEditor.setDecorations(hintDecorationType, []);

      return;
    }

    let text = activeEditor.document.getText();
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

    const phpFunctions = [];

    for (let index = 0; index < phpArguments.length; index++) {
      var argument = phpArguments[index];

      const start = new vscode.Position(argument.start.line, argument.start.character);
      const end = new vscode.Position(argument.end.line, argument.end.character);

      let args;
      try {
        args = await getParamName(
          activeEditor,
          new vscode.Position(argument.expression.line, argument.expression.character),
          argument.key
        );
      } catch (err) {
        printError(err);
      }

      if (args) {
        args = args.trim();
        const hint =
          args
            .replace('$', ' ')
            .replace('... ', ' ...')
            .replace('& ', ' &') + ': ';
        const decorationPHP = Hints.paramHint(hint, new vscode.Range(start, end));

        phpFunctions.push(decorationPHP);
      }
    }

    activeEditor.setDecorations(hintDecorationType, phpFunctions);
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
    let lastEnd = 0;

    while (true) {
      let startIndex = Infinity;
      let currentOpenTag = '';

      phpOpenTags.forEach(tag => {
        let tmpIndex = text.indexOf(tag);

        if (tmpIndex !== -1 && tmpIndex < startIndex) {
          startIndex = tmpIndex;
          currentOpenTag = tag;
        }
      });

      if (startIndex === Infinity) {
        break;
      }

      phpOnly = phpOnly + text.substring(lastEnd, startIndex).replace(/[^\n\t\r]{1}/g, ' ');
      text = text.substring(startIndex);

      startIndex = 0;
      let endIndex = text.indexOf(phpCloseTag);

      if (endIndex === -1) {
        phpOnly =
          phpOnly +
          text.substring(startIndex).replace(currentOpenTag, ' '.repeat(currentOpenTag.length));
        break;
      } else {
        let closeTagReplace = ';' + ' '.repeat(phpCloseTag.length - 1);

        phpOnly =
          phpOnly +
          text
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

    timeout = setTimeout(updateDecorations, delay);
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

    let intelephenseExtension = vscode.extensions.getExtension(
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
    _ => {
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
