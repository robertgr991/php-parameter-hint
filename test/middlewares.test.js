// eslint-disable-next-line import/no-unresolved
const vscode = require('vscode');
const path = require('path');
const { describe, it, before, afterEach, after } = require('mocha');
const { expect } = require('chai');
const { getCopyFunc } = require('../src/utils');
const { sleep, examplesFolderPath } = require('./utils');
const { FunctionGroupsFacade } = require('../src/functionGroupsFacade');
const { CacheService } = require('../src/cache');
const { onlyLiterals, onlySelection, onlyVisibleRanges } = require('../src/middlewares');
const { Pipeline } = require('../src/pipeline');

const copy = getCopyFunc();

describe('middlewares', () => {
  /** @type {vscode.TextEditor} */
  let editor;
  let initialFunctionGroups;

  before(async () => {
    const functionGroupsFacade = new FunctionGroupsFacade(new CacheService());
    const uri = vscode.Uri.file(path.join(`${examplesFolderPath}middlewares.php`));
    const document = await vscode.workspace.openTextDocument(uri);
    editor = await vscode.window.showTextDocument(document);
    await sleep(500); // wait for file to be completely functional
    initialFunctionGroups = await functionGroupsFacade.get(
      editor.document.uri.toString(),
      editor.document.getText()
    );
  });

  describe('onlyLiterals', () => {
    it('should return only function groups and args with literals when called with should apply true', () => {
      // @ts-ignore
      const onlyLiteralsFunctionGroups = onlyLiterals(copy(initialFunctionGroups), true);
      const expectedFunctionGroups = [
        {
          name: '',
          args: [
            {
              key: 0,
              start: {
                line: 3,
                character: 5
              },
              end: {
                line: 3,
                character: 9
              },
              name: '',
              kind: 'string'
            }
          ],
          line: 3,
          character: 4
        },
        {
          name: '',
          args: [
            {
              key: 0,
              start: {
                line: 5,
                character: 24
              },
              end: {
                line: 5,
                character: 35
              },
              name: '',
              kind: 'string'
            }
          ],
          line: 5,
          character: 23
        },
        {
          name: '',
          args: [
            {
              key: 0,
              start: {
                line: 98,
                character: 32
              },
              end: {
                line: 98,
                character: 45
              },
              name: '',
              kind: 'string'
            }
          ],
          line: 98,
          character: 31
        }
      ];
      expect(onlyLiteralsFunctionGroups).to.deep.equal(expectedFunctionGroups);
    });
    it('should return the same function groups when called with should apply false', () => {
      // @ts-ignore
      const onlyLiteralsFunctionGroups = onlyLiterals(copy(initialFunctionGroups), false);
      expect(initialFunctionGroups).to.deep.equal(onlyLiteralsFunctionGroups);
    });
  });
  describe('onlySelection', () => {
    before(() => {
      const { range } = editor.document.lineAt(5);
      editor.selection = new vscode.Selection(range.start, range.end);
      editor.revealRange(range);
    });
    it('should return hints only for current line/selection when called with should apply true', () => {
      // @ts-ignore
      const selectionFunctionGroups = onlySelection(copy(initialFunctionGroups), editor, true);
      const expectedFunctionGroups = [
        {
          name: '',
          args: [
            {
              key: 0,
              start: {
                line: 5,
                character: 24
              },
              end: {
                line: 5,
                character: 35
              },
              name: '',
              kind: 'string'
            }
          ],
          line: 5,
          character: 23
        }
      ];
      expect(selectionFunctionGroups).to.deep.equal(expectedFunctionGroups);
    });
    it('should return the same function groups when called with should apply false', () => {
      // @ts-ignore
      const selectionFunctionGroups = onlySelection(copy(initialFunctionGroups), editor, false);
      expect(selectionFunctionGroups).to.deep.equal(initialFunctionGroups);
    });
  });
  describe('onlyVisibleRanges', () => {
    it('should return hints only for visible ranges when called with should apply true', () => {
      const visibleRangesFunctionGroups = onlyVisibleRanges(
        // @ts-ignore
        copy(initialFunctionGroups),
        editor,
        true
      );
      const expectedFunctionGroups = [
        {
          name: '',
          args: [
            {
              key: 0,
              start: {
                line: 3,
                character: 5
              },
              end: {
                line: 3,
                character: 9
              },
              name: '',
              kind: 'string'
            },
            {
              key: 1,
              start: {
                line: 3,
                character: 11
              },
              end: {
                line: 3,
                character: 19
              },
              name: 'numbers',
              kind: 'variable'
            }
          ],
          line: 3,
          character: 4
        },
        {
          name: '',
          args: [
            {
              key: 0,
              start: {
                line: 5,
                character: 24
              },
              end: {
                line: 5,
                character: 35
              },
              name: '',
              kind: 'string'
            }
          ],
          line: 5,
          character: 23
        }
      ];
      expect(visibleRangesFunctionGroups).to.deep.equal(expectedFunctionGroups);
    });
    it('should return the same function groups when called with should apply false', () => {
      const visibleRangesFunctionGroups = onlyVisibleRanges(
        // @ts-ignore
        copy(initialFunctionGroups),
        editor,
        false
      );
      expect(initialFunctionGroups).to.deep.equal(visibleRangesFunctionGroups);
    });
    describe('', () => {
      before(async () => {
        const lastLine = editor.document.lineCount - 1;
        const { range } = editor.document.lineAt(lastLine);
        editor.selection = new vscode.Selection(range.start, range.end);
        editor.revealRange(range);
        await sleep(500); // wait for editor to scroll
      });
      after(async () => {
        const { range } = editor.document.lineAt(0);
        editor.selection = new vscode.Selection(range.start, range.end);
        editor.revealRange(range);
        await sleep(500); // wait for editor to scroll
      });

      it('should return the new function groups after visible ranges change', async () => {
        const visibleRangesFunctionGroups = onlyVisibleRanges(
          // @ts-ignore
          copy(initialFunctionGroups),
          editor,
          true
        );
        const expectedFunctionGroups = [
          {
            name: '',
            args: [
              {
                key: 0,
                start: {
                  line: 98,
                  character: 32
                },
                end: {
                  line: 98,
                  character: 45
                },
                name: '',
                kind: 'string'
              }
            ],
            line: 98,
            character: 31
          }
        ];
        expect(expectedFunctionGroups).to.deep.equal(visibleRangesFunctionGroups);
      });
    });
  });
  describe('combination of middlewares', () => {
    const pipeline = new Pipeline();

    afterEach(() => {
      pipeline.clear();
    });

    it('should return only literals and in visible ranges function groups', async () => {
      const onlyLiteralsAndVisibleRangesFunctionGroups = await pipeline
        .pipe([onlyLiterals, true], [onlyVisibleRanges, editor, true])
        // @ts-ignore
        .process(copy(initialFunctionGroups));
      const expectedFunctionGroups = [
        {
          name: '',
          args: [
            {
              key: 0,
              start: {
                line: 3,
                character: 5
              },
              end: {
                line: 3,
                character: 9
              },
              name: '',
              kind: 'string'
            }
          ],
          line: 3,
          character: 4
        },
        {
          name: '',
          args: [
            {
              key: 0,
              start: {
                line: 5,
                character: 24
              },
              end: {
                line: 5,
                character: 35
              },
              name: '',
              kind: 'string'
            }
          ],
          line: 5,
          character: 23
        }
      ];
      expect(onlyLiteralsAndVisibleRangesFunctionGroups).to.deep.equal(expectedFunctionGroups);
    });
    it('should return the same function groups when all middlewares are called with should apply false', async () => {
      const onlyLiteralsAndVisibleRangesFunctionGroups = await pipeline
        .pipe([onlyLiterals, false], [onlyVisibleRanges, editor, false])
        // @ts-ignore
        .process(copy(initialFunctionGroups));
      expect(onlyLiteralsAndVisibleRangesFunctionGroups).to.deep.equal(initialFunctionGroups);
    });
  });
});
