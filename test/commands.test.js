// eslint-disable-next-line import/no-unresolved
const vscode = require('vscode');
const path = require('path');
const { describe, it, before, after } = require('mocha');
const { expect } = require('chai');
const { sleep, examplesFolderPath } = require('./utils');

describe('commands', () => {
  before(async () => {
    const uri = vscode.Uri.file(path.join(`${examplesFolderPath}general.php`));
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);
    await sleep(500); // wait for file to be completely functional
  });
  after(async () => {
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  });

  describe('toggleTypeName', () => {
    after(async () => {
      await vscode.workspace.getConfiguration('phpParameterHint').update('hintTypeName', 0, true);
      await sleep(1000);
    });
    it('should cycle between available options', async () => {
      await vscode.workspace.getConfiguration('phpParameterHint').update('hintTypeName', 0, true);
      await sleep(1000);
      let hintTypeName = vscode.workspace.getConfiguration('phpParameterHint').get('hintTypeName');
      expect(hintTypeName).to.equal(0);
      await vscode.commands.executeCommand('phpParameterHint.toggleTypeName');
      await sleep(1000);
      hintTypeName = vscode.workspace.getConfiguration('phpParameterHint').get('hintTypeName');
      expect(hintTypeName).to.equal(1);
      await vscode.commands.executeCommand('phpParameterHint.toggleTypeName');
      await sleep(1000);
      hintTypeName = vscode.workspace.getConfiguration('phpParameterHint').get('hintTypeName');
      expect(hintTypeName).to.equal(2);
      await vscode.commands.executeCommand('phpParameterHint.toggleTypeName');
      await sleep(1000);
      hintTypeName = vscode.workspace.getConfiguration('phpParameterHint').get('hintTypeName');
      expect(hintTypeName).to.equal(0);
    });
  });
  describe('switchable commands', async () => {
    const switchableCommandsTable = [
      {
        name: 'toggle',
        valueName: 'enabled',
        default: true
      },
      {
        name: 'toggleOnChange',
        valueName: 'onChange',
        default: false
      },
      {
        name: 'toggleOnSave',
        valueName: 'onSave',
        default: true
      },
      {
        name: 'toggleLiterals',
        valueName: 'hintOnlyLiterals',
        default: false
      },
      {
        name: 'toggleLine',
        valueName: 'hintOnlyLine',
        default: false
      },
      {
        name: 'toggleVisibleRanges',
        valueName: 'hintOnlyVisibleRanges',
        default: false
      },
      {
        name: 'toggleCollapse',
        valueName: 'collapseHintsWhenEqual',
        default: false
      },
      {
        name: 'toggleCollapseType',
        valueName: 'collapseTypeWhenEqual',
        default: false
      },
      {
        name: 'toggleFullType',
        valueName: 'showFullType',
        default: false
      },
      {
        name: 'toggleDollarSign',
        valueName: 'showDollarSign',
        default: false
      }
    ];
    after(async () => {
      for (const command of switchableCommandsTable) {
        await vscode.workspace
          .getConfiguration('phpParameterHint')
          .update(command.valueName, command.default, true);
      }
      await sleep(1000);
    });

    for (const command of switchableCommandsTable) {
      describe(command.name, () => {
        it(`should enable/disable ${command.valueName}`, async () => {
          await vscode.workspace
            .getConfiguration('phpParameterHint')
            .update(command.valueName, true, true);
          await sleep(1000);
          let value = vscode.workspace.getConfiguration('phpParameterHint').get(command.valueName);
          expect(value).to.equal(true);
          await vscode.commands.executeCommand(`phpParameterHint.${command.name}`);
          await sleep(1000);
          value = vscode.workspace.getConfiguration('phpParameterHint').get(command.valueName);
          expect(value).to.equal(false);
          await vscode.commands.executeCommand(`phpParameterHint.${command.name}`);
          await sleep(1000);
          value = vscode.workspace.getConfiguration('phpParameterHint').get(command.valueName);
          expect(value).to.equal(true);
        });
      });
    }
  });
});
