// eslint-disable-next-line import/no-unresolved
const vscode = require('vscode');
const path = require('path');
const { describe, it, before, after } = require('mocha');
const { expect } = require('chai');
const { sleep, examplesFolderPath } = require('./utils');
const { FunctionGroupsFacade } = require('../src/functionGroupsFacade');
const { CacheService } = require('../src/cache');
const { update } = require('../src/update');

describe('update', () => {
  /** @type {vscode.TextEditor} */
  let editor;
  let functionGroups;
  const expectedDecorations = [
    {
      range: new vscode.Range(new vscode.Position(12, 10), new vscode.Position(12, 14)),
      renderOptions: {
        before: {
          opacity: 0.4,
          color: {
            id: 'phpParameterHint.hintForeground'
          },
          contentText: 'glue:',
          backgroundColor: {
            id: 'phpParameterHint.hintBackground'
          },
          margin: '0px 3px 0px 2px;padding: 1px 4px;',
          borderRadius: '5px',
          fontStyle: 'italic',
          fontWeight: '400;font-size:12px;'
        }
      }
    },
    {
      range: new vscode.Range(new vscode.Position(12, 16), new vscode.Position(12, 25)),
      renderOptions: {
        before: {
          opacity: 0.4,
          color: {
            id: 'phpParameterHint.hintForeground'
          },
          contentText: 'pieces:',
          backgroundColor: {
            id: 'phpParameterHint.hintBackground'
          },
          margin: '0px 3px 0px 2px;padding: 1px 4px;',
          borderRadius: '5px',
          fontStyle: 'italic',
          fontWeight: '400;font-size:12px;'
        }
      }
    },
    {
      range: new vscode.Range(new vscode.Position(13, 9), new vscode.Position(13, 10)),
      renderOptions: {
        before: {
          opacity: 0.4,
          color: {
            id: 'phpParameterHint.hintForeground'
          },
          contentText: 'vars[0]:',
          backgroundColor: {
            id: 'phpParameterHint.hintBackground'
          },
          margin: '0px 3px 0px 2px;padding: 1px 4px;',
          borderRadius: '5px',
          fontStyle: 'italic',
          fontWeight: '400;font-size:12px;'
        }
      }
    },
    {
      range: new vscode.Range(new vscode.Position(13, 12), new vscode.Position(13, 13)),
      renderOptions: {
        before: {
          opacity: 0.4,
          color: {
            id: 'phpParameterHint.hintForeground'
          },
          contentText: 'vars[1]:',
          backgroundColor: {
            id: 'phpParameterHint.hintBackground'
          },
          margin: '0px 3px 0px 2px;padding: 1px 4px;',
          borderRadius: '5px',
          fontStyle: 'italic',
          fontWeight: '400;font-size:12px;'
        }
      }
    },
    {
      range: new vscode.Range(new vscode.Position(13, 15), new vscode.Position(13, 16)),
      renderOptions: {
        before: {
          opacity: 0.4,
          color: {
            id: 'phpParameterHint.hintForeground'
          },
          contentText: 'vars[2]:',
          backgroundColor: {
            id: 'phpParameterHint.hintBackground'
          },
          margin: '0px 3px 0px 2px;padding: 1px 4px;',
          borderRadius: '5px',
          fontStyle: 'italic',
          fontWeight: '400;font-size:12px;'
        }
      }
    }
  ];

  before(async () => {
    const uri = vscode.Uri.file(path.join(`${examplesFolderPath}general.php`));
    const document = await vscode.workspace.openTextDocument(uri);
    editor = await vscode.window.showTextDocument(document);
    await sleep(500); // wait for file to be completely functional
    functionGroups = await new FunctionGroupsFacade(new CacheService()).get(
      editor.document.uri.toString(),
      editor.document.getText()
    );
  });
  after(async () => {
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  });

  it('should return the correct decorations', async () => {
    const decorations = await update(editor, functionGroups);
    expect(decorations).to.deep.equal(expectedDecorations);
  });
  it('should cancel the first call and return null when a second one is made and the first one has not finished', async () => {
    const [firstDecorations, secondDecorations] = await Promise.all([
      update(editor, functionGroups),
      update(editor, functionGroups)
    ]);
    expect(firstDecorations).to.be.null;
    expect(secondDecorations).to.deep.equal(expectedDecorations);
  });
});
