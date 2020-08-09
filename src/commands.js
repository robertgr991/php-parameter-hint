/* eslint-disable import/no-unresolved */
const vscode = require('vscode');

// default = 'disabled' - only name
const showTypeEnum = Object.freeze({ 0: 'disabled', 1: 'type and name', 2: 'type' });

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

    // Command to toggle between showing param name, name and type and only type
    const showTypeKeys = Object.keys(showTypeEnum).map(key => parseInt(key, 10));
    const minShowType = Math.min(...showTypeKeys);
    const maxShowType = Math.max(...showTypeKeys);
    vscode.commands.registerCommand('phpParameterHint.toggleTypeName', () => {
      const currentShowState = vscode.workspace
        .getConfiguration('phpParameterHint')
        .get('hintTypeName');
      const newShowState = currentShowState >= maxShowType ? minShowType : currentShowState + 1;
      message = `${messageHeader} Hint both name and type: ${showTypeEnum[newShowState]}`;

      vscode.workspace
        .getConfiguration('phpParameterHint')
        .update('hintTypeName', newShowState, true);
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

    // Command to enable/disable collapsing hints when param name is equal to
    // variable name
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

    // Command to enable/disable collapsing type and parameter name when hinting
    // types is enabled and they are equal
    vscode.commands.registerCommand('phpParameterHint.toggleCollapseType', () => {
      const currentState = vscode.workspace
        .getConfiguration('phpParameterHint')
        .get('collapseTypeWhenEqual');
      message = `${messageHeader} Collapse type and parameter name ${
        currentState ? 'disabled' : 'enabled'
      }`;

      vscode.workspace
        .getConfiguration('phpParameterHint')
        .update('collapseTypeWhenEqual', !currentState, true);
      vscode.window.setStatusBarMessage(message, hideMessageAfterMs);
    });

    // Show full type, including namespaces instead of the short name
    vscode.commands.registerCommand('phpParameterHint.toggleFullType', () => {
      const currentState = vscode.workspace
        .getConfiguration('phpParameterHint')
        .get('showFullType');
      message = `${messageHeader} Show full type ${currentState ? 'disabled' : 'enabled'}`;

      vscode.workspace
        .getConfiguration('phpParameterHint')
        .update('showFullType', !currentState, true);
      vscode.window.setStatusBarMessage(message, hideMessageAfterMs);
    });
  }
}

module.exports = { Commands, showTypeEnum };
