const { describe, it } = require('mocha');
const { expect } = require('chai');
const { Pipeline } = require('./pipeline');

const double = x => x * 2;

describe('Pipeline', () => {
  describe('with pipes', () => {
    it('should correctly execute all the pushed functions', async () => {
      const addAsync = async (x, toAdd) => x + toAdd;
      const negateAsync = x => new Promise(resolve => setTimeout(() => resolve(-x), 1));
      const pipeline = new Pipeline();
      const initial = 1;
      const expected = -3;
      const result = await pipeline.pipe(double, [addAsync, 1], negateAsync).process(initial);
      expect(result).to.equal(expected);
    });
  });

  describe('without pipes', () => {
    it('should return the initial result when there are no pipes', async () => {
      let pipeline = new Pipeline();
      const initial = 1;
      const expected = 1;
      let result = await pipeline.process(initial);
      expect(result).to.equal(expected);

      pipeline = new Pipeline();
      result = await pipeline.pipe(undefined).process(initial);
      expect(result).to.equal(expected);
    });
  });
  describe('clear pipes', () => {
    it('should remove all existing pipes', async () => {
      const pipeline = new Pipeline();
      const initial = 1;
      let result = await pipeline
        .pipe(double)
        .clear()
        .process(initial);
      expect(result).to.equal(initial);
      await pipeline.pipe(double).process(initial, true);
      result = await pipeline.process(initial);
      expect(result).to.equal(initial);
    });
  });
});
