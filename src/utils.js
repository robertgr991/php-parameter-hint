const copy = require('fast-copy');

const sameNamePlaceholder = '%';

const isDefined = value => typeof value !== 'undefined';

const removeShebang = code => {
  const codeArr = code.split('\n');

  if (codeArr[0].substr(0, 2) === '#!') {
    codeArr[0] = '';
  }

  return codeArr.join('\n');
};

const getCopyFunc = () => {
  return process.env.NODE_ENV === 'test' ? copy : copy.default;
};

module.exports = {
  removeShebang,
  sameNamePlaceholder,
  isDefined,
  getCopyFunc
};
