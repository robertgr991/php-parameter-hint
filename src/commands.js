/* eslint-disable import/no-unresolved */
const vscode = require('vscode');

class Commands {
  static registerCommands() {
    const messageHeader = 'PHP Parameter Hint: ';
    const hideMessageAfterMs = 3000;
    let message;

    // Command to hide / show hints
    vscode.commands.registerCommand('phpParameterHint.toggle', () => {
      const currentState = vscode.workspace.getConfiguration('phpParameterHint').get('enabled');
      message = `${messageHeader} Hints ${currentState ? 'disabled' : 'enabled'}`;

      vscode.workspace.getConfiguration('phpParameterHint').update('enabled', !currentState, true);
      vscode.window.setStatusBarMessage(message, hideMessageAfterMs);
    });

    // Command to enable/disable hinting only literals
    vscode.commands.registerCommand('phpParameterHint.toggleLiterals', () => {
      const currentState = vscode.workspace
        .getConfiguration('phpParameterHint')
        .get('hintOnlyLiterals');
      message = `${messageHeader} Hint only literals ${currentState ? 'disabled' : 'enabled'}`;

      vscode.workspace
        .getConfiguration('phpParameterHint')
        .update('hintOnlyLiterals', !currentState, true);
      vscode.window.setStatusBarMessage(message, hideMessageAfterMs);
    });

    // Command to enable/disable hinting only line/selection
    vscode.commands.registerCommand('phpParameterHint.toggleLine', () => {
      const currentState = vscode.workspace
        .getConfiguration('phpParameterHint')
        .get('hintOnlyLine');
      message = `${messageHeader} Hint only line/selection ${
        currentState ? 'disabled' : 'enabled'
      }`;

      vscode.workspace
        .getConfiguration('phpParameterHint')
        .update('hintOnlyLine', !currentState, true);
      vscode.window.setStatusBarMessage(message, hideMessageAfterMs);
    });

    // Command to enable/disable collapsing hints
    vscode.commands.registerCommand('phpParameterHint.toggleCollapse', () => {
      const currentState = vscode.workspace
        .getConfiguration('phpParameterHint')
        .get('collapseHintsWhenEqual');
      message = `${messageHeader} Collapse hints ${currentState ? 'disabled' : 'enabled'}`;

      vscode.workspace
        .getConfiguration('phpParameterHint')
        .update('collapseHintsWhenEqual', !currentState, true);
      vscode.window.setStatusBarMessage(message, hideMessageAfterMs);
    });
  }
}

module.exports = Commands;
