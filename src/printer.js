/* eslint-disable import/no-unresolved */
const vscode = require('vscode');

const channel = vscode.window.createOutputChannel('PHP Parameter Hint');

/**
 * Print an error
 * @param {string} err
 */
const printError = err => {
  channel.appendLine(`${new Date().toLocaleString()} Error: ${err}`);
};

module.exports = {
  printError
};
