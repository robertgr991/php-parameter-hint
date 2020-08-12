const test = require('ava').default;
const { isDefined, removeShebang } = require('./utils');

test('isDefined', t => {
  const hint = 'user:';
  t.is(isDefined(undefined), false);
  t.is(isDefined(hint), true);
});

test('removeShebang', t => {
  const withShebang = {
    input: `#!\n<?php\necho 'test';`,
    output: `\n<?php\necho 'test';`
  };
  const withoutShebang = {
    input: `<?php\necho 'test';`,
    output: `<?php\necho 'test';`
  };
  t.is(removeShebang(withShebang.input), withShebang.output);
  t.is(removeShebang(withoutShebang.input), withoutShebang.output);
});
