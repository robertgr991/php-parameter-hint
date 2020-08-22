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
    vscode.commands.registerCommand('phpParameterHint.toggle', async () => {
      const currentState = vscode.workspace.getConfiguration('phpParameterHint').get('enabled');
      message = `${messageHeader} Hints ${currentState ? 'disabled' : 'enabled'}`;

      await vscode.workspace
        .getConfiguration('phpParameterHint')
        .update('enabled', !currentState, true);
      vscode.window.setStatusBarMessage(message, hideMessageAfterMs);
    });

    // Command to toggle hinting on text change
    vscode.commands.registerCommand('phpParameterHint.toggleOnChange', async () => {
      const currentState = vscode.workspace.getConfiguration('phpParameterHint').get('onChange');
      message = `${messageHeader} Hint on change ${currentState ? 'disabled' : 'enabled'}`;

      await vscode.workspace
        .getConfiguration('phpParameterHint')
        .update('onChange', !currentState, true);
      vscode.window.setStatusBarMessage(message, hideMessageAfterMs);
    });

    // Command to toggle hinting on document save
    vscode.commands.registerCommand('phpParameterHint.toggleOnSave', async () => {
      const currentState = vscode.workspace.getConfiguration('phpParameterHint').get('onSave');
      message = `${messageHeader} Hint on save ${currentState ? 'disabled' : 'enabled'}`;

      await vscode.workspace
        .getConfiguration('phpParameterHint')
        .update('onSave', !currentState, true);
      vscode.window.setStatusBarMessage(message, hideMessageAfterMs);
    });

    // Command to toggle between showing param name, name and type and only type
    const showTypeKeys = Object.keys(showTypeEnum).map(key => parseInt(key, 10));
    const minShowType = Math.min(...showTypeKeys);
    const maxShowType = Math.max(...showTypeKeys);
    vscode.commands.registerCommand('phpParameterHint.toggleTypeName', async () => {
      const currentShowState = vscode.workspace
        .getConfiguration('phpParameterHint')
        .get('hintTypeName');
      const newShowState = currentShowState >= maxShowType ? minShowType : currentShowState + 1;
      message = `${messageHeader} Hint both name and type: ${showTypeEnum[newShowState]}`;

      await vscode.workspace
        .getConfiguration('phpParameterHint')
        .update('hintTypeName', newShowState, true);
      vscode.window.setStatusBarMessage(message, hideMessageAfterMs);
    });

    // Command to enable/disable hinting only literals
    vscode.commands.registerCommand('phpParameterHint.toggleLiterals', async () => {
      const currentState = vscode.workspace
        .getConfiguration('phpParameterHint')
        .get('hintOnlyLiterals');
      message = `${messageHeader} Hint only literals ${currentState ? 'disabled' : 'enabled'}`;

      await vscode.workspace
        .getConfiguration('phpParameterHint')
        .update('hintOnlyLiterals', !currentState, true);
      vscode.window.setStatusBarMessage(message, hideMessageAfterMs);
    });

    // Command to enable/disable hinting only line/selection
    vscode.commands.registerCommand('phpParameterHint.toggleLine', async () => {
      const currentState = vscode.workspace
        .getConfiguration('phpParameterHint')
        .get('hintOnlyLine');
      message = `${messageHeader} Hint only line/selection ${
        currentState ? 'disabled' : 'enabled'
      }`;

      await vscode.workspace
        .getConfiguration('phpParameterHint')
        .update('hintOnlyLine', !currentState, true);
      vscode.window.setStatusBarMessage(message, hideMessageAfterMs);
    });

    // Command to enable/disable hinting only visible ranges
    vscode.commands.registerCommand('phpParameterHint.toggleVisibleRanges', async () => {
      const currentState = vscode.workspace
        .getConfiguration('phpParameterHint')
        .get('hintOnlyVisibleRanges');
      message = `${messageHeader} Hint only visible ranges ${
        currentState ? 'disabled' : 'enabled'
      }`;

      await vscode.workspace
        .getConfiguration('phpParameterHint')
        .update('hintOnlyVisibleRanges', !currentState, true);
      vscode.window.setStatusBarMessage(message, hideMessageAfterMs);
    });

    // Command to enable/disable collapsing hints when param name is equal to
    // variable name
    vscode.commands.registerCommand('phpParameterHint.toggleCollapse', async () => {
      const currentState = vscode.workspace
        .getConfiguration('phpParameterHint')
        .get('collapseHintsWhenEqual');
      message = `${messageHeader} Collapse hints ${currentState ? 'disabled' : 'enabled'}`;

      await vscode.workspace
        .getConfiguration('phpParameterHint')
        .update('collapseHintsWhenEqual', !currentState, true);
      vscode.window.setStatusBarMessage(message, hideMessageAfterMs);
    });

    // Command to enable/disable collapsing type and parameter name when hinting
    // types is enabled and they are equal
    vscode.commands.registerCommand('phpParameterHint.toggleCollapseType', async () => {
      const currentState = vscode.workspace
        .getConfiguration('phpParameterHint')
        .get('collapseTypeWhenEqual');
      message = `${messageHeader} Collapse type and parameter name ${
        currentState ? 'disabled' : 'enabled'
      }`;

      await vscode.workspace
        .getConfiguration('phpParameterHint')
        .update('collapseTypeWhenEqual', !currentState, true);
      vscode.window.setStatusBarMessage(message, hideMessageAfterMs);
    });

    // Show full type, including namespaces instead of the short name
    vscode.commands.registerCommand('phpParameterHint.toggleFullType', async () => {
      const currentState = vscode.workspace
        .getConfiguration('phpParameterHint')
        .get('showFullType');
      message = `${messageHeader} Show full type ${currentState ? 'disabled' : 'enabled'}`;

      await vscode.workspace
        .getConfiguration('phpParameterHint')
        .update('showFullType', !currentState, true);
      vscode.window.setStatusBarMessage(message, hideMessageAfterMs);
    });

    // Show dollar sign for parameter name
    vscode.commands.registerCommand('phpParameterHint.toggleDollarSign', async () => {
      const currentState = vscode.workspace
        .getConfiguration('phpParameterHint')
        .get('showDollarSign');
      message = `${messageHeader} Show dollar sign for parameter name ${
        currentState ? 'disabled' : 'enabled'
      }`;

      await vscode.workspace
        .getConfiguration('phpParameterHint')
        .update('showDollarSign', !currentState, true);
      vscode.window.setStatusBarMessage(message, hideMessageAfterMs);
    });
  }
}

module.exports = { Commands, showTypeEnum };
