const test = require('ava');
const { Pipeline } = require('./pipeline');

// @ts-ignore
test('Pipeline', async t => {
  const double = x => x * 2;
  const addAsync = async (x, toAdd) => x + toAdd;
  const negateAsync = x => new Promise(resolve => setTimeout(() => resolve(-x), 1));
  const pipeline = new Pipeline();
  const initial = 1;
  const expected = -3;
  const result = await pipeline.pipe(double, [addAsync, 1], negateAsync).process(initial);
  t.is(result, expected);
});
