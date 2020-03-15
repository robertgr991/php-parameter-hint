/* eslint-disable no-loop-func */
/* eslint-disable no-param-reassign */
const phpOpenTags = ['<?php', '<?=', '<?'];
const phpCloseTag = '?>';

/**
 * Return only text containing php code, rest of the text is converted to *spaces
 *
 * @param {string} text
 */
function getPHPOnly(text) {
  let phpOnly = '';
  const lastEnd = 0;

  while (true) {
    let startIndex = Infinity;
    let currentOpenTag = '';

    phpOpenTags.forEach(tag => {
      const tmpIndex = text.indexOf(tag);

      if (tmpIndex !== -1 && tmpIndex < startIndex) {
        startIndex = tmpIndex;
        currentOpenTag = tag;
      }
    });

    if (startIndex === Infinity) {
      break;
    }

    phpOnly += text.substring(lastEnd, startIndex).replace(/[^\n\t\r]{1}/g, ' ');
    text = text.substring(startIndex);

    startIndex = 0;
    const endIndex = text.indexOf(phpCloseTag);

    if (endIndex === -1) {
      phpOnly += text
        .substring(startIndex)
        .replace(currentOpenTag, ' '.repeat(currentOpenTag.length));
      break;
    } else {
      const closeTagReplace = `;${' '.repeat(phpCloseTag.length - 1)}`;

      phpOnly += text
        .substring(startIndex, endIndex + phpCloseTag.length)
        .replace(currentOpenTag, ' '.repeat(currentOpenTag.length))
        .replace(phpCloseTag, closeTagReplace);
      text = text.substring(endIndex + phpCloseTag.length);
    }
  }

  return phpOnly;
}

module.exports = {
  getPHPOnly
};
