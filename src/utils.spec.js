const { describe, it } = require('mocha');
const { expect } = require('chai');
const { isDefined, removeShebang, getCopyFunc } = require('./utils');

describe('isDefined', () => {
  it('should return a boolean indicating whether the passed argument is defined', () => {
    const hint = 'user:';
    expect(isDefined(undefined)).to.be.false;
    expect(isDefined(hint)).to.be.true;
  });
});

describe('removeShebang', () => {
  it('should remove the shebang if it exists', () => {
    const withShebang = {
      input: `#!\n<?php\necho 'test';`,
      output: `\n<?php\necho 'test';`
    };
    const withoutShebang = {
      input: `<?php\necho 'test';`,
      output: `<?php\necho 'test';`
    };
    expect(removeShebang(withShebang.input)).to.equal(withShebang.output);
    expect(removeShebang(withoutShebang.input)).to.equal(withoutShebang.output);
  });
});

describe('getCopyFunc', () => {
  it('should return the default export only when process.env is not "test"', () => {
    expect(() => {
      const copy = getCopyFunc();
      const values = [1, 2, 3];
      // @ts-ignore
      const clonedValues = copy(values);
      expect(values).to.deep.equal(clonedValues);
      expect(values).to.not.equal(clonedValues);
    }).to.not.throw();
  });
});
