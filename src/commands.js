/* eslint-disable import/no-unresolved */
const vscode = require('vscode');

class Commands {
  static registerCommands() {
    // Command to hide / show annotations
    vscode.commands.registerCommand('phpParameterHint.toggle', () => {
      const currentState = vscode.workspace.getConfiguration('phpParameterHint').get('enabled');
      vscode.workspace.getConfiguration('phpParameterHint').update('enabled', !currentState, true);
    });
  }
}

module.exports = Commands;
