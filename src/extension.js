// eslint-disable-next-line import/no-unresolved
const vscode = require('vscode');
const debounce = require('lodash.debounce');
const { Commands } = require('./commands');
const { printError } = require('./printer');
const { update } = require('./update');
const { onlyLiterals, onlySelection, onlyVisibleRanges } = require('./middlewares');
const { Pipeline } = require('./pipeline');
const { CacheService } = require('./cache');
const { FunctionGroupsFacade } = require('./functionGroupsFacade');

const hintDecorationType = vscode.window.createTextEditorDecorationType({});
const initialNrTries = 3;

/**
 * This method is called when VSCode is activated
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  let timeout;
  let activeEditor = vscode.window.activeTextEditor;
  const functionGroupsFacade = new FunctionGroupsFacade(new CacheService());

  /**
   * Get the PHP code then parse it and create parameter hints
   */
  async function updateDecorations() {
    timeout = undefined;

    if (!activeEditor || !activeEditor.document || activeEditor.document.languageId !== 'php') {
      return;
    }

    const { document: currentDocument } = activeEditor;
    const uriStr = currentDocument.uri.toString();
    const isEnabled = vscode.workspace.getConfiguration('phpParameterHint').get('enabled');

    if (!isEnabled) {
      activeEditor.setDecorations(hintDecorationType, []);

      return;
    }

    const text = currentDocument.getText();
    let functionGroups = [];
    const hintOnChange = vscode.workspace.getConfiguration('phpParameterHint').get('onChange');
    const hintOnlyLine = vscode.workspace.getConfiguration('phpParameterHint').get('hintOnlyLine');
    const hintOnlyLiterals = vscode.workspace
      .getConfiguration('phpParameterHint')
      .get('hintOnlyLiterals');
    const hintOnlyVisibleRanges = vscode.workspace
      .getConfiguration('phpParameterHint')
      .get('hintOnlyVisibleRanges');

    try {
      functionGroups = await functionGroupsFacade.get(uriStr, text);
    } catch (err) {
      printError(err);

      if (hintOnChange || hintOnlyLine) {
        return;
      }
    }

    if (!functionGroups.length) {
      activeEditor.setDecorations(hintDecorationType, []);

      return;
    }

    const finalFunctionGroups = await new Pipeline()
      .pipe(
        [onlyLiterals, hintOnlyLiterals],
        [onlyVisibleRanges, activeEditor, hintOnlyVisibleRanges],
        [onlySelection, activeEditor, hintOnlyLine]
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
  const handleVisibleRangesChange = debounce(() => {
    if (
      activeEditor &&
      vscode.workspace.getConfiguration('phpParameterHint').get('hintOnlyVisibleRanges')
    ) {
      triggerUpdateDecorations(0);
    }
  }, 333);
  vscode.window.onDidChangeTextEditorVisibleRanges(
    handleVisibleRangesChange,
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
    debounce(event => {
      if (
        activeEditor &&
        event.document === activeEditor.document &&
        vscode.workspace.getConfiguration('phpParameterHint').get('onChange')
      ) {
        triggerUpdateDecorations(
          vscode.workspace.getConfiguration('phpParameterHint').get('changeDelay')
        );
      }
    }, 333),
    null,
    context.subscriptions
  );
  vscode.workspace.onDidSaveTextDocument(
    document => {
      if (
        activeEditor &&
        activeEditor.document === document &&
        vscode.workspace.getConfiguration('phpParameterHint').get('onSave')
      ) {
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
