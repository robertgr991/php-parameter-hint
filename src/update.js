// eslint-disable-next-line import/no-unresolved
const vscode = require('vscode');
// const { singleton } = require('js-coroutines');
const getHints = require('./parameterExtractor');
const { printError } = require('./printer');
const Hints = require('./hints');
const { pause } = require('./utils');

const hintDecorationType = vscode.window.createTextEditorDecorationType({});
const slowAfterNrParam = 300;
const showParamsOnceEvery = 100;
let runId = 0;

/**
 * The function that creates the new decorations, if the number of arguments
 * is bigger than slowAfterNrParam, then the update of the decorations will be
 * called once every showParamsOnceEvery
 *
 * When the function is called, the last call it's interrupted
 *
 * @param {vscode.TextEditor} activeEditor
 * @param {array} functionGroups
 */
async function update(activeEditor, functionGroups) {
  runId = Date.now();
  const currentRunId = runId;
  const shouldContinue = () => runId === currentRunId;
  const argumentsLen = functionGroups.reduce((accumulator, currentGroup) => {
    return accumulator + currentGroup.args.length;
  }, 0);
  let nrArgs = 0;
  const phpDecorations = [];
  const functionGroupsLen = functionGroups.length;
  const functionDictionary = new Map();

  for (let index = 0; index < functionGroupsLen; index += 1) {
    if (!shouldContinue()) {
      return null;
    }

    const functionGroup = functionGroups[index];
    let hints;

    try {
      hints = await getHints(functionDictionary, functionGroup, activeEditor);
    } catch (err) {
      printError(err);
    }

    if (hints && hints.length) {
      for (const hint of hints) {
        const decorationPHP = Hints.paramHint(hint.text, hint.range);
        phpDecorations.push(decorationPHP);
        nrArgs += 1;

        if (argumentsLen > slowAfterNrParam) {
          if (nrArgs % showParamsOnceEvery === 0) {
            activeEditor.setDecorations(hintDecorationType, phpDecorations);
            // Continue on next event loop iteration
            await pause(10);

            if (!shouldContinue()) {
              return null;
            }
          }
        }
      }
    }
  }

  await pause(10);

  if (!shouldContinue()) {
    return null;
  }

  activeEditor.setDecorations(hintDecorationType, phpDecorations);
  return phpDecorations;
}

module.exports = {
  update
};
