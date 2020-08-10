const test = require('ava');
const { Pipeline } = require('./pipeline');

// @ts-ignore
test('with pipes', async t => {
  const double = x => x * 2;
  const addAsync = async (x, toAdd) => x + toAdd;
  const negateAsync = x => new Promise(resolve => setTimeout(() => resolve(-x), 1));
  const pipeline = new Pipeline();
  const initial = 1;
  const expected = -3;
  const result = await pipeline.pipe(double, [addAsync, 1], negateAsync).process(initial);
  t.is(result, expected);
});

// @ts-ignore
test('without pipes', async t => {
  let pipeline = new Pipeline();
  const initial = 1;
  const expected = 1;
  let result = await pipeline.process(initial);
  t.is(result, expected);

  pipeline = new Pipeline();
  result = await pipeline.pipe(undefined).process(initial);
  t.is(result, expected);
});
