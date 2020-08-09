// eslint-disable-next-line import/no-unresolved
const vscode = require('vscode');
const { singleton } = require('js-coroutines');
const getHints = require('./parameterExtractor');
const { printError } = require('./printer');
const { sameNamePlaceholder } = require('./utils');
const Hints = require('./hints');

const hintDecorationType = vscode.window.createTextEditorDecorationType({});
const slowAfterNrParam = 300;
const showParamsOnceEvery = 100;

/**
 * The function that creates the new decorations, if the number of arguments
 * is bigger than slowAfterNrParam, then the update of the decorations will be
 * called once every showParamsOnceEvery
 *
 * When the function is called, the last call it's interrupted
 */
function* update(activeEditor, functionGroups) {
  const argumentsLen = functionGroups.reduce((accumulator, currentGroup) => {
    return accumulator + currentGroup.args.length;
  }, 0);
  let nrArgs = 0;
  const phpDecorations = [];
  const collapseHintsWhenEqual = vscode.workspace
    .getConfiguration('phpParameterHint')
    .get('collapseHintsWhenEqual');
  const functionGroupsLen = functionGroups.length;
  const functionDictionary = new Map();

  for (let index = 0; index < functionGroupsLen; index += 1) {
    const functionGroup = functionGroups[index];
    let args;

    try {
      args = yield getHints(functionDictionary, functionGroup, activeEditor).catch(err =>
        printError(err)
      );
    } catch (err) {
      printError(err);
    }

    if (args && args.length) {
      // eslint-disable-next-line no-restricted-syntax
      for (const arg of args) {
        let hint = '';

        if (collapseHintsWhenEqual && arg.name.indexOf('$') === -1) {
          if (arg.name === sameNamePlaceholder) {
            // eslint-disable-next-line no-continue
            continue;
          } else {
            hint = `${arg.name.replace(sameNamePlaceholder, '').trim()}:`;
          }
        } else {
          hint = `${arg.name.replace('$', '').replace('& ', '&')}:`;
        }

        const decorationPHP = Hints.paramHint(hint, arg.range);
        phpDecorations.push(decorationPHP);
        nrArgs += 1;

        if (argumentsLen > slowAfterNrParam) {
          if (nrArgs % showParamsOnceEvery === 0) {
            yield;
            activeEditor.setDecorations(hintDecorationType, phpDecorations);
            // Continue on next event loop iteration
            yield true;
          }
        }
      }
    }
  }

  yield;
  activeEditor.setDecorations(hintDecorationType, phpDecorations);
}

module.exports = {
  update: singleton(update)
};
