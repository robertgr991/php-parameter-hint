const vscode = require('vscode');

class Commands {
  static registerCommands() {
    // Command to hide / show hints
    vscode.commands.registerCommand('phpParameterHint.toggle', () => {
      const currentState = vscode.workspace.getConfiguration('phpParameterHint').get('enabled');
      vscode.workspace.getConfiguration('phpParameterHint').update('enabled', !currentState, true);
    });
    vscode.commands.registerCommand('phpParameterHint.toggleLiterals', () => {
      const currentState = vscode.workspace
        .getConfiguration('phpParameterHint')
        .get('hintOnlyLiterals');
      vscode.workspace
        .getConfiguration('phpParameterHint')
        .update('hintOnlyLiterals', !currentState, true);
    });
    vscode.commands.registerCommand('phpParameterHint.toggleLine', () => {
      const currentState = vscode.workspace
        .getConfiguration('phpParameterHint')
        .get('hintOnlyLine');
      vscode.workspace
        .getConfiguration('phpParameterHint')
        .update('hintOnlyLine', !currentState, true);
    });
    vscode.commands.registerCommand('phpParameterHint.toggleCollapse', () => {
      const currentState = vscode.workspace
        .getConfiguration('phpParameterHint')
        .get('collapseHintsWhenEqual');
      vscode.workspace
        .getConfiguration('phpParameterHint')
        .update('collapseHintsWhenEqual', !currentState, true);
    });
  }
}

module.exports = Commands;
