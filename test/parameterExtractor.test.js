// eslint-disable-next-line import/no-unresolved
const vscode = require('vscode');
const path = require('path');
const { describe, it, after, before } = require('mocha');
const { expect } = require('chai');
const { getCopyFunc } = require('../src/utils');
const { FunctionGroupsFacade } = require('../src/functionGroupsFacade');
const { CacheService } = require('../src/cache');
const getHints = require('../src/parameterExtractor');
const { sleep, examplesFolderPath } = require('./utils');

const copy = getCopyFunc();

describe('parameterExtractor', () => {
  describe('getHints', () => {
    const compareHints = (hints, expectedHints) => {
      hints.forEach((hintGroups, indexGroup) => {
        hintGroups.forEach((hint, index) => {
          expect(hint.text).to.deep.equal(expectedHints[indexGroup][index].text);
          expect(hint.range.start.line).to.deep.equal(
            expectedHints[indexGroup][index].range.start.line
          );
          expect(hint.range.start.character).to.deep.equal(
            expectedHints[indexGroup][index].range.start.character
          );
          expect(hint.range.end.line).to.deep.equal(
            expectedHints[indexGroup][index].range.end.line
          );
          expect(hint.range.end.character).to.deep.equal(
            expectedHints[indexGroup][index].range.end.character
          );
        });
      });
    };

    describe('general', () => {
      let functionGroupsLen;
      let functionDictionary;
      let expectedNameHints;
      const { Range, Position } = vscode;
      let editor;
      let functionGroups;

      before(async () => {
        const functionGroupsFacade = new FunctionGroupsFacade(new CacheService());
        const uri = vscode.Uri.file(path.join(`${examplesFolderPath}general.php`));
        const document = await vscode.workspace.openTextDocument(uri);
        editor = await vscode.window.showTextDocument(document);
        await sleep(500); // wait for file to fully load
        functionGroups = await functionGroupsFacade.get(
          editor.document.uri.toString(),
          editor.document.getText()
        );
        functionGroupsLen = functionGroups.length;
        functionDictionary = new Map();

        expectedNameHints = [
          [
            {
              text: 'glue:',
              range: new Range(new Position(12, 10), new Position(12, 14))
            },
            {
              text: 'pieces:',
              range: new Range(new Position(12, 16), new Position(12, 25))
            }
          ],
          [
            {
              text: 'vars[0]:',
              range: new Range(new Position(13, 9), new Position(13, 10))
            },
            {
              text: 'vars[1]:',
              range: new Range(new Position(13, 12), new Position(13, 13))
            },
            {
              text: 'vars[2]:',
              range: new Range(new Position(13, 15), new Position(13, 16))
            }
          ]
        ];
      });
      after(async () => {
        await vscode.workspace.getConfiguration('phpParameterHint').update('hintTypeName', 0, true);
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        await sleep(500);
      });

      const compare = (hints, expectedHints) => {
        expect(hints).to.have.lengthOf(2);
        expect(hints[0]).to.have.lengthOf(2);
        expect(hints[1]).to.have.lengthOf(3);

        compareHints(hints, expectedHints);
      };

      it('should return name hints', async () => {
        await vscode.workspace.getConfiguration('phpParameterHint').update('hintTypeName', 0, true);
        const hints = [];

        for (let index = 0; index < functionGroupsLen; index += 1) {
          const functionGroup = functionGroups[index];
          try {
            hints.push(await getHints(functionDictionary, functionGroup, editor));
            // eslint-disable-next-line no-empty
          } catch (err) {}
        }

        compare(hints, expectedNameHints);
      });
      it('should return type and name hints', async () => {
        await vscode.workspace.getConfiguration('phpParameterHint').update('hintTypeName', 1, true);
        // @ts-ignore
        const expectedTypeAndNameHints = copy(expectedNameHints);
        expectedTypeAndNameHints[0][0].text = 'string glue:';
        expectedTypeAndNameHints[0][1].text = 'array pieces:';
        expectedTypeAndNameHints[1][0].text = 'int vars[0]:';
        expectedTypeAndNameHints[1][1].text = 'int vars[1]:';
        expectedTypeAndNameHints[1][2].text = 'int vars[2]:';
        const hints = [];

        for (let index = 0; index < functionGroupsLen; index += 1) {
          const functionGroup = functionGroups[index];
          try {
            hints.push(await getHints(functionDictionary, functionGroup, editor));
            // eslint-disable-next-line no-empty
          } catch (err) {}
        }

        compare(hints, expectedTypeAndNameHints);
      });

      it('should return type hints', async () => {
        await vscode.workspace.getConfiguration('phpParameterHint').update('hintTypeName', 2, true);
        // @ts-ignore
        const expectedTypeHints = copy(expectedNameHints);
        expectedTypeHints[0][0].text = 'string:';
        expectedTypeHints[0][1].text = 'array:';
        expectedTypeHints[1][0].text = 'int[0]:';
        expectedTypeHints[1][1].text = 'int[1]:';
        expectedTypeHints[1][2].text = 'int[2]:';
        const hints = [];

        for (let index = 0; index < functionGroupsLen; index += 1) {
          const functionGroup = functionGroups[index];
          try {
            hints.push(await getHints(functionDictionary, functionGroup, editor));
            // eslint-disable-next-line no-empty
          } catch (err) {}
        }

        compare(hints, expectedTypeHints);
      });
    });
    describe('showDollarSign', () => {
      let functionGroupsLen;
      let functionDictionary;
      let expectedHints;
      const { Range, Position } = vscode;
      let editor;
      let functionGroups;

      before(async () => {
        const functionGroupsFacade = new FunctionGroupsFacade(new CacheService());
        const uri = vscode.Uri.file(path.join(`${examplesFolderPath}showDollarSign.php`));
        const document = await vscode.workspace.openTextDocument(uri);
        editor = await vscode.window.showTextDocument(document);
        await sleep(500); // wait for file to fully load
        functionGroups = await functionGroupsFacade.get(
          editor.document.uri.toString(),
          editor.document.getText()
        );
        functionGroupsLen = functionGroups.length;
        functionDictionary = new Map();

        expectedHints = [
          [
            {
              text: 'str:',
              range: new Range(new Position(2, 16), new Position(2, 21))
            }
          ]
        ];
      });
      after(async () => {
        await vscode.workspace
          .getConfiguration('phpParameterHint')
          .update('showDollarSign', false, true);
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        await sleep(500);
      });

      const compare = (hints, expected) => {
        expect(hints).to.have.lengthOf(1);
        expect(hints[0]).to.have.lengthOf(1);
        compareHints(hints, expected);
      };

      it('should return hints with parameter name without the dollar sign', async () => {
        await vscode.workspace
          .getConfiguration('phpParameterHint')
          .update('showDollarSign', false, true);
        const hints = [];

        for (let index = 0; index < functionGroupsLen; index += 1) {
          const functionGroup = functionGroups[index];
          try {
            hints.push(await getHints(functionDictionary, functionGroup, editor));
            // eslint-disable-next-line no-empty
          } catch (err) {}
        }

        compare(hints, expectedHints);
      });
      it('should return hints with parameter name with dollar sign', async () => {
        await vscode.workspace
          .getConfiguration('phpParameterHint')
          .update('showDollarSign', true, true);
        const hints = [];
        // @ts-ignore
        const expectedDollarHints = copy(expectedHints);
        expectedDollarHints[0][0].text = '$str:';

        for (let index = 0; index < functionGroupsLen; index += 1) {
          const functionGroup = functionGroups[index];
          try {
            hints.push(await getHints(functionDictionary, functionGroup, editor));
            // eslint-disable-next-line no-empty
          } catch (err) {}
        }

        compare(hints, expectedDollarHints);
      });
    });
    describe('showFullType', () => {
      let functionGroupsLen;
      let functionDictionary;
      let expectedHints;
      const { Range, Position } = vscode;
      let editor;
      let functionGroups;

      before(async () => {
        const functionGroupsFacade = new FunctionGroupsFacade(new CacheService());
        const uri = vscode.Uri.file(path.join(`${examplesFolderPath}showFullType.php`));
        const document = await vscode.workspace.openTextDocument(uri);
        editor = await vscode.window.showTextDocument(document);
        await vscode.workspace.getConfiguration('phpParameterHint').update('hintTypeName', 2, true); // hint only type
        await sleep(500); // wait for file to fully load
        functionGroups = await functionGroupsFacade.get(
          editor.document.uri.toString(),
          editor.document.getText()
        );
        functionGroupsLen = functionGroups.length;
        functionDictionary = new Map();

        expectedHints = [
          [
            {
              text: 'User:',
              range: new Range(new Position(8, 8), new Position(8, 18))
            }
          ]
        ];
      });
      after(async () => {
        await vscode.workspace.getConfiguration('phpParameterHint').update('hintTypeName', 0, true);
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        await vscode.workspace
          .getConfiguration('phpParameterHint')
          .update('showFullType', false, true);
        await sleep(500);
      });

      const compare = (hints, expected) => {
        expect(hints).to.have.lengthOf(1);
        expect(hints[0]).to.have.lengthOf(1);
        compareHints(hints, expected);
      };

      it('should return hints with short type', async () => {
        await vscode.workspace
          .getConfiguration('phpParameterHint')
          .update('showFullType', false, true);
        const hints = [];

        for (let index = 0; index < functionGroupsLen; index += 1) {
          const functionGroup = functionGroups[index];
          try {
            hints.push(await getHints(functionDictionary, functionGroup, editor));
            // eslint-disable-next-line no-empty
          } catch (err) {}
        }

        compare(hints, expectedHints);
      });
      it('should return hints with full type', async () => {
        await vscode.workspace
          .getConfiguration('phpParameterHint')
          .update('showFullType', true, true);
        const hints = [];
        // @ts-ignore
        const expectedFullTypeHints = copy(expectedHints);
        expectedFullTypeHints[0][0].text = 'Models\\User:';

        for (let index = 0; index < functionGroupsLen; index += 1) {
          const functionGroup = functionGroups[index];
          try {
            hints.push(await getHints(functionDictionary, functionGroup, editor));
            // eslint-disable-next-line no-empty
          } catch (err) {}
        }

        compare(hints, expectedFullTypeHints);
      });
    });
    describe('collapseHintsWhenEqual', () => {
      let functionGroupsLen;
      let functionDictionary;
      let expectedHints;
      const { Range, Position } = vscode;
      let editor;
      let functionGroups;

      before(async () => {
        const functionGroupsFacade = new FunctionGroupsFacade(new CacheService());
        const uri = vscode.Uri.file(path.join(`${examplesFolderPath}collapseHintsWhenEqual.php`));
        const document = await vscode.workspace.openTextDocument(uri);
        editor = await vscode.window.showTextDocument(document);
        await vscode.workspace.getConfiguration('phpParameterHint').update('hintTypeName', 0, true); // hint only parameter name
        await sleep(500); // wait for file to fully load
        functionGroups = await functionGroupsFacade.get(
          editor.document.uri.toString(),
          editor.document.getText()
        );
        functionGroupsLen = functionGroups.length;
        functionDictionary = new Map();

        expectedHints = [
          [
            {
              text: 'string:',
              range: new Range(new Position(3, 16), new Position(3, 23))
            }
          ]
        ];
      });
      after(async () => {
        await vscode.workspace
          .getConfiguration('phpParameterHint')
          .update('collapseHintsWhenEqual', false, true);
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        await sleep(500);
      });

      const compare = (hints, expected) => {
        expect(hints).to.have.lengthOf(1);
        expect(hints[0]).to.have.lengthOf(1);
        compareHints(hints, expected);
      };

      it('should return the hint', async () => {
        await vscode.workspace
          .getConfiguration('phpParameterHint')
          .update('collapseHintsWhenEqual', false, true);
        const hints = [];

        for (let index = 0; index < functionGroupsLen; index += 1) {
          const functionGroup = functionGroups[index];
          try {
            hints.push(await getHints(functionDictionary, functionGroup, editor));
            // eslint-disable-next-line no-empty
          } catch (err) {}
        }

        compare(hints, expectedHints);
      });
      it('should not return the hint because the var name matches the parameter name', async () => {
        await vscode.workspace
          .getConfiguration('phpParameterHint')
          .update('collapseHintsWhenEqual', true, true);
        const hints = [];

        for (let index = 0; index < functionGroupsLen; index += 1) {
          const functionGroup = functionGroups[index];
          try {
            hints.push(await getHints(functionDictionary, functionGroup, editor));
            // eslint-disable-next-line no-empty
          } catch (err) {}
        }

        expect(hints).to.have.lengthOf(1);
        expect(hints[0]).to.have.lengthOf(0);
      });
    });
    describe('collapseTypeWhenEqual', () => {
      let functionGroupsLen;
      let functionDictionary;
      let expectedHints;
      const { Range, Position } = vscode;
      let editor;
      let functionGroups;

      before(async () => {
        const functionGroupsFacade = new FunctionGroupsFacade(new CacheService());
        const uri = vscode.Uri.file(path.join(`${examplesFolderPath}collapseTypeWhenEqual.php`));
        const document = await vscode.workspace.openTextDocument(uri);
        editor = await vscode.window.showTextDocument(document);
        await vscode.workspace.getConfiguration('phpParameterHint').update('hintTypeName', 1, true); // hint type and name
        await sleep(500); // wait for file to fully load
        functionGroups = await functionGroupsFacade.get(
          editor.document.uri.toString(),
          editor.document.getText()
        );
        functionGroupsLen = functionGroups.length;
        functionDictionary = new Map();

        expectedHints = [
          [
            {
              text: 'string string:',
              range: new Range(new Position(3, 16), new Position(3, 23))
            }
          ]
        ];
      });
      after(async () => {
        await vscode.workspace.getConfiguration('phpParameterHint').update('hintTypeName', 0, true); // hint type and name
        await vscode.workspace
          .getConfiguration('phpParameterHint')
          .update('collapseTypeWhenEqual', false, true); // hint type and name
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        await sleep(500);
      });

      const compare = (hints, expected) => {
        expect(hints).to.have.lengthOf(1);
        expect(hints[0]).to.have.lengthOf(1);
        compareHints(hints, expected);
      };

      it('should return the hint with both type and name', async () => {
        await vscode.workspace
          .getConfiguration('phpParameterHint')
          .update('collapseTypeWhenEqual', false, true);
        const hints = [];

        for (let index = 0; index < functionGroupsLen; index += 1) {
          const functionGroup = functionGroups[index];
          try {
            hints.push(await getHints(functionDictionary, functionGroup, editor));
            // eslint-disable-next-line no-empty
          } catch (err) {}
        }

        compare(hints, expectedHints);
      });
      it('should return the hint only with parameter name because it matches with the type', async () => {
        await vscode.workspace
          .getConfiguration('phpParameterHint')
          .update('collapseTypeWhenEqual', true, true);
        const hints = [];
        // @ts-ignore
        const expectedCollapseTypeHints = copy(expectedHints);
        expectedCollapseTypeHints[0][0].text = 'string:';

        for (let index = 0; index < functionGroupsLen; index += 1) {
          const functionGroup = functionGroups[index];
          try {
            hints.push(await getHints(functionDictionary, functionGroup, editor));
            // eslint-disable-next-line no-empty
          } catch (err) {}
        }

        compare(hints, expectedCollapseTypeHints);
      });
    });
  });
});
