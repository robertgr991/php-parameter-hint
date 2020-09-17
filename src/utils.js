const copy = require('fast-copy');

const sameNamePlaceholder = '%';

/**
 *
 * @param {any} value
 */
const isDefined = value => typeof value !== 'undefined';

/**
 *
 * @param {string} code
 */
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

/**
 *
 * @param {number} time in ms
 */
const pause = (time = 0) => new Promise(resolve => setTimeout(resolve, time));

module.exports = {
  removeShebang,
  sameNamePlaceholder,
  isDefined,
  getCopyFunc,
  pause
};
