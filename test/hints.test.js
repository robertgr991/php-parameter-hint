// eslint-disable-next-line import/no-unresolved
const vscode = require('vscode');
const path = require('path');
const { describe, it, before, after } = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');
const { sleep, examplesFolderPath } = require('./utils');
const { FunctionGroupsFacade } = require('../src/functionGroupsFacade');
const { CacheService } = require('../src/cache');
const getHints = require('../src/parameterExtractor');
const Hints = require('../src/hints');

describe('hints', () => {
  /** @type {{text: string, range: vscode.Range}} */
  let hint;

  before(async () => {
    const uri = vscode.Uri.file(path.join(`${examplesFolderPath}general.php`));
    const document = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(document);
    await sleep(500); // wait for file to be completely functional
    const [functionGroup] = await new FunctionGroupsFacade(new CacheService()).get(
      editor.document.uri.toString(),
      editor.document.getText()
    );
    [hint] = await getHints(new Map(), functionGroup, editor);
  });
  after(async () => {
    sinon.restore();
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  });

  it('should have the correct range', () => {
    const { range } = Hints.paramHint(hint.text, hint.range);
    expect(range.start.line).to.equal(hint.range.start.line);
    expect(range.start.character).to.equal(hint.range.start.character);
    expect(range.end.line).to.equal(hint.range.end.line);
    expect(range.end.character).to.equal(hint.range.end.character);
  });
  it('should have the correct css props', () => {
    const stub = sinon.stub(vscode.workspace, 'getConfiguration');
    const getStub = sinon.stub();
    stub.withArgs('phpParameterHint').returns({
      get: getStub,
      has: sinon.fake(),
      inspect: sinon.fake(),
      update: sinon.fake()
    });
    const expectedOpacity = 0.5;
    const expectedFontStyle = 'bold';
    const expectedFontWeight = 500;
    const expectedFontSize = 13;
    const expectedBorderRadius = 6;
    const expectedVerticalPadding = 2;
    const expectedHorizontalPadding = 5;
    const expectedMargin = 3;
    const expectedColor = {
      id: 'phpParameterHint.hintForeground'
    };
    const expectedBackgroundColor = {
      id: 'phpParameterHint.hintBackground'
    };

    getStub
      .withArgs('opacity')
      .returns(expectedOpacity)
      .withArgs('fontStyle')
      .returns(expectedFontStyle)
      .withArgs('fontWeight')
      .returns(expectedFontWeight)
      .withArgs('fontSize')
      .returns(expectedFontSize)
      .withArgs('borderRadius')
      .returns(expectedBorderRadius)
      .withArgs('verticalPadding')
      .returns(expectedVerticalPadding)
      .withArgs('horizontalPadding')
      .returns(expectedHorizontalPadding)
      .withArgs('margin')
      .returns(expectedMargin);

    const {
      renderOptions: {
        before: {
          opacity,
          contentText,
          color,
          backgroundColor,
          margin,
          fontStyle,
          fontWeight,
          borderRadius
        }
      }
    } = Hints.paramHint(hint.text, hint.range);
    expect(opacity).to.equal(expectedOpacity);
    expect(color).to.deep.equal(expectedColor);
    expect(backgroundColor).to.deep.equal(expectedBackgroundColor);
    expect(fontStyle).to.equal(expectedFontStyle);
    expect(fontWeight).to.equal(`${expectedFontWeight};font-size:${expectedFontSize}px;`);
    expect(contentText).to.equal(hint.text);
    expect(borderRadius).to.equal(`${expectedBorderRadius}px`);
    expect(opacity).to.equal(expectedOpacity);
    expect(margin).to.equal(
      `0px ${expectedMargin +
        1}px 0px ${expectedMargin}px;padding: ${expectedVerticalPadding}px ${expectedHorizontalPadding}px;`
    );
  });
});
