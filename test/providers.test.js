// eslint-disable-next-line import/no-unresolved
const vscode = require('vscode');
const path = require('path');
const { describe, it, before, after } = require('mocha');
const { expect } = require('chai');
const { sleep, examplesFolderPath } = require('./utils');
const { FunctionGroupsFacade } = require('../src/functionGroupsFacade');
const { CacheService } = require('../src/cache');
const signature = require('../src/providers/signature');
const hover = require('../src/providers/hover');

describe('providers', () => {
  /** @type {vscode.TextEditor} */
  let editor;
  let functionGroups;

  before(async () => {
    const functionGroupsFacade = new FunctionGroupsFacade(new CacheService());
    const uri = vscode.Uri.file(path.join(`${examplesFolderPath}providers.php`));
    const document = await vscode.workspace.openTextDocument(uri);
    editor = await vscode.window.showTextDocument(document);
    await sleep(500); // wait for file to be completely functional
    functionGroups = await functionGroupsFacade.get(
      editor.document.uri.toString(),
      editor.document.getText()
    );
  });
  after(async () => {
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  });

  const getArgs = async (provider, showType) => {
    /** @type {array} */
    const args = await Promise.all(
      functionGroups.map(functionGroup => {
        const line = provider === signature ? functionGroup.args[0].start.line : functionGroup.line;
        const character =
          provider === signature ? functionGroup.args[0].start.character : functionGroup.character;
        return provider.getArgs(editor, line, character, showType);
      })
    );

    // @ts-ignore
    return args.flat();
  };
  const providers = [
    {
      name: 'signature',
      func: signature
    },
    {
      name: 'hover',
      func: hover
    }
  ];

  for (const provider of providers) {
    describe(provider.name, () => {
      it('should return only parameters names', async () => {
        const args = await getArgs(provider.func, 'disabled');
        const expectedArgs = ['$glue', '$pieces', '$name', '...$ages'];
        expect(args).to.deep.equal(expectedArgs);
      });
      it('should return parameters names and types', async () => {
        let args = await getArgs(provider.func, 'type and name');
        const expectedArgs = ['string $glue', 'array $pieces', 'string $name', 'mixed ...$ages'];
        expect(args).to.deep.equal(expectedArgs);
        args = await getArgs(provider.func, 'type');
        expect(args).to.deep.equal(expectedArgs);
      });
    });
  }
});
