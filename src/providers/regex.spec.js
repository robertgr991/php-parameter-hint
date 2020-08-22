const { describe, it } = require('mocha');
const { expect } = require('chai');
const { getDocRegex, getDefRegex } = require('./regex');

describe('regexp for documentation', () => {
  describe('with data types included', () => {
    const regExDocTypes = getDocRegex('types');

    it('should extract the type and name', () => {
      const extractedTypeAndNameArr = new RegExp(regExDocTypes.source, 'gims').exec(
        '@param_ `\\Models\\User $user`'
      );
      expect(extractedTypeAndNameArr).to.have.lengthOf(5);
      expect(extractedTypeAndNameArr[1]).to.equal('`\\Models\\User $user');
    });
    it('should return the correct representation when the argument is variadic', () => {
      const extractedTypeAndNameArr = new RegExp(regExDocTypes.source, 'gims').exec(
        '@param_ `int ...$numbers`'
      );
      expect(extractedTypeAndNameArr).to.have.lengthOf(5);
      expect(extractedTypeAndNameArr[1]).to.equal('`int ...$numbers');
    });
    it('should extract the correct representation when the argument is passed by reference', () => {
      const extractedTypeAndNameArr = new RegExp(regExDocTypes.source, 'gims').exec(
        '@param_ `string &$glue`'
      );
      expect(extractedTypeAndNameArr).to.have.lengthOf(5);
      expect(extractedTypeAndNameArr[1]).to.equal('`string &$glue');
    });
    it('should correctly extract all the params when there are multiple', () => {
      const extractedTypeAndNameMatchArr = '@param_ `string $glue` \n @param_ `int ...$numbers`'.match(
        new RegExp(regExDocTypes.source, 'gims')
      );
      expect(extractedTypeAndNameMatchArr).to.have.lengthOf(2);
      expect(extractedTypeAndNameMatchArr[0]).to.equal('`string $glue');
      expect(extractedTypeAndNameMatchArr[1]).to.equal('`int ...$numbers');
    });
  });
  describe('without data types', () => {
    const regExDoc = getDocRegex('disabled');

    it('should extract only the parameter name', () => {
      const extractedNameArr = new RegExp(regExDoc.source, 'gims').exec('@param_ `string $glue`');
      expect(extractedNameArr).to.have.lengthOf(4);
      expect(extractedNameArr[1]).to.equal('$glue');
    });
    it('should extract the correct representation when the argument is variadic', () => {
      const extractedNameArr = new RegExp(regExDoc.source, 'gims').exec(
        '@param_ `int ...$numbers`'
      );
      expect(extractedNameArr).to.have.lengthOf(4);
      expect(extractedNameArr[1]).to.equal('...$numbers');
    });
    it('should extract the correct representation when the argument is passed by reference', () => {
      const extractedNameArr = new RegExp(regExDoc.source, 'gims').exec('@param_ `User &$user`');
      expect(extractedNameArr).to.have.lengthOf(4);
      expect(extractedNameArr[1]).to.equal('&$user');
    });
    it('should correctly extract all the params when there are multiple', () => {
      const extractedNameMatchArr = '@param_ `string $glue` \n @param_ `int ...$numbers`'.match(
        new RegExp(regExDoc.source, 'gims')
      );
      expect(extractedNameMatchArr).to.have.lengthOf(2);
      expect(extractedNameMatchArr[0]).to.equal('`string $glue');
      expect(extractedNameMatchArr[1]).to.equal('`int ...$numbers');
    });
  });
});

describe('regexp for function definition', () => {
  describe('with data types included', () => {
    const regExDefTypes = getDefRegex('types');

    it('should extract the type and name', () => {
      const extractedTypeAndNameArr = 'function join(string $glue = "", array $pieces)'.match(
        new RegExp(regExDefTypes.source, 'gims')
      );
      expect(extractedTypeAndNameArr).to.have.lengthOf(2);
      expect(extractedTypeAndNameArr[0]).to.equal('string $glue');
      expect(extractedTypeAndNameArr[1]).to.equal(' array $pieces');
    });
    it('should return the correct representation when the argument is variadic', () => {
      const extractedTypeAndNameArr = 'function join(int ...$numbers)'.match(
        new RegExp(regExDefTypes.source, 'gims')
      );
      expect(extractedTypeAndNameArr).to.have.lengthOf(1);
      expect(extractedTypeAndNameArr[0]).to.equal('int ...$numbers');
    });
    it('should extract the correct representation when the argument is passed by reference and when there are multiple parameters', () => {
      const extractedTypeAndNameArr = 'function join(string &$glue = "", array &$pieces)'.match(
        new RegExp(regExDefTypes.source, 'gims')
      );
      expect(extractedTypeAndNameArr).to.have.lengthOf(2);
      expect(extractedTypeAndNameArr[0]).to.equal('string &$glue');
      expect(extractedTypeAndNameArr[1]).to.equal(' array &$pieces');
    });
  });

  describe('without data types', () => {
    const regExDef = getDefRegex('disabled');

    it('should extract only the parameter name', () => {
      const extractedNameArr = 'function join($glue = "", $pieces)'.match(
        new RegExp(regExDef.source, 'gims')
      );
      expect(extractedNameArr).to.have.lengthOf(2);
      expect(extractedNameArr[0]).to.equal('$glue');
      expect(extractedNameArr[1]).to.equal('$pieces');
    });
    it('should extract the correct representation when the argument is variadic', () => {
      const extractedNameArr = 'function join(...$numbers)'.match(
        new RegExp(regExDef.source, 'gims')
      );
      expect(extractedNameArr).to.have.lengthOf(1);
      expect(extractedNameArr[0]).to.equal('...$numbers');
    });
    it('should extract the correct representation when the argument is passed by reference', () => {
      const extractedNameArr = 'function join(&$glue)'.match(new RegExp(regExDef.source, 'gims'));
      expect(extractedNameArr).to.have.lengthOf(1);
      expect(extractedNameArr[0]).to.equal('&$glue');
    });
  });
});
