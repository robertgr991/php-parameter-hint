// eslint-disable-next-line import/no-unresolved
const vscode = require('vscode');
const Parser = require('./parser');

class FunctionGroupsFacade {
  constructor(cacheService) {
    this.cacheService = cacheService;
  }

  /**
   * @param {string} uri
   * @param {string} text
   */
  async get(uri, text) {
    if (await this.cacheService.isCachedTextValid(uri, text)) {
      return this.cacheService.getFunctionGroups(uri);
    }

    this.cacheService.deleteFunctionGroups(uri);
    const isPhp7 = vscode.workspace.getConfiguration('phpParameterHint').get('php7');
    const parser = new Parser(isPhp7);
    parser.parse(text);
    const { functionGroups } = parser;
    await this.cacheService.setFunctionGroups(uri, text, functionGroups);
    return functionGroups;
  }
}

module.exports = {
  FunctionGroupsFacade
};
