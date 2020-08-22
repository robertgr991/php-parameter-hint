// eslint-disable-next-line import/no-unresolved
const vscode = require('vscode');
const path = require('path');
const { describe, it, before, after } = require('mocha');
const { expect } = require('chai');
const { FunctionGroupsFacade } = require('../src/functionGroupsFacade');
const { CacheService } = require('../src/cache');
const { sleep, examplesFolderPath } = require('./utils');

describe('FunctionGroupsFacade', () => {
  /** @type {vscode.TextEditor} */
  let editor;

  before(async () => {
    const uri = vscode.Uri.file(path.join(`${examplesFolderPath}general.php`));
    const document = await vscode.workspace.openTextDocument(uri);
    editor = await vscode.window.showTextDocument(document);
    await sleep(500); // wait for file to be completely functional
  });
  after(async () => {
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  });

  describe('get', () => {
    it('should return the correct function groups', async () => {
      const functionGroupsFacade = new FunctionGroupsFacade(new CacheService());
      const functionGroups = await functionGroupsFacade.get(
        editor.document.uri.toString(),
        editor.document.getText()
      );
      const expectedFunctionGroups = [
        {
          name: '',
          args: [
            {
              key: 0,
              start: {
                line: 12,
                character: 10
              },
              end: {
                line: 12,
                character: 14
              },
              name: '',
              kind: 'string'
            },
            {
              key: 1,
              start: {
                line: 12,
                character: 16
              },
              end: {
                line: 12,
                character: 25
              },
              name: '',
              kind: 'array'
            }
          ],
          line: 12,
          character: 9
        },
        {
          name: '',
          args: [
            {
              key: 0,
              start: {
                line: 13,
                character: 9
              },
              end: {
                line: 13,
                character: 10
              },
              name: '',
              kind: 'number'
            },
            {
              key: 1,
              start: {
                line: 13,
                character: 12
              },
              end: {
                line: 13,
                character: 13
              },
              name: '',
              kind: 'number'
            },
            {
              key: 2,
              start: {
                line: 13,
                character: 15
              },
              end: {
                line: 13,
                character: 16
              },
              name: '',
              kind: 'number'
            }
          ],
          line: 13,
          character: 8
        }
      ];

      expect(functionGroups).to.have.lengthOf(2);
      expect(functionGroups).to.deep.equal(expectedFunctionGroups);
    });
  });
});
