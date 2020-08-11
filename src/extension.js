// eslint-disable-next-line import/no-unresolved
const vscode = require('vscode');
const { Commands } = require('./commands');
const Parser = require('./parser');
const { printError } = require('./printer');
const { update } = require('./update');
const { onlyLiterals, onlySelection } = require('./middlewares');
const { Pipeline } = require('./pipeline');

const hintDecorationType = vscode.window.createTextEditorDecorationType({});
const initialNrTries = 3;

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
  async function updateDecorations() {
    if (!activeEditor || !activeEditor.document || activeEditor.document.languageId !== 'php') {
      return;
    }

    const isEnabled = vscode.workspace.getConfiguration('phpParameterHint').get('enabled');

    if (!isEnabled) {
      activeEditor.setDecorations(hintDecorationType, []);

      return;
    }

    const text = activeEditor.document.getText();
    let functionGroups = [];

    try {
      const isPhp7 = vscode.workspace.getConfiguration('phpParameterHint').get('php7');
      const parser = new Parser(isPhp7);
      parser.parse(text);
      functionGroups = parser.functionGroups;
    } catch (err) {
      printError(err);

      if (
        vscode.workspace.getConfiguration('phpParameterHint').get('onChange') ||
        vscode.workspace.getConfiguration('phpParameterHint').get('hintOnlyLine')
      ) {
        return;
      }
    }

    if (functionGroups.length === 0) {
      activeEditor.setDecorations(hintDecorationType, []);

      return;
    }

    const finalFunctionGroups = await new Pipeline()
      .pipe(
        [
          onlyLiterals,
          vscode.workspace.getConfiguration('phpParameterHint').get('hintOnlyLiterals')
        ],
        [
          onlySelection,
          activeEditor,
          vscode.workspace.getConfiguration('phpParameterHint').get('hintOnlyLine')
        ]
      )
      .process(functionGroups);
    await update(activeEditor, finalFunctionGroups);
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

    timeout = setTimeout(() => updateDecorations(), delay);
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
  vscode.window.onDidChangeActiveTextEditor(
    editor => {
      activeEditor = editor;

      if (activeEditor) {
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
  Commands.registerCommands();

  if (activeEditor) {
    tryInitial(initialNrTries);
  }
}

module.exports = {
  activate
};
