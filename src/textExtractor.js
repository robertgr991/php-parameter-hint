const phpOpenTags = ['<?php', '<?=', '<?'];
const phpCloseTag = '?>';

/**
 * Return only text containing php code, rest of the text is converted to *spaces
 *
 * @param {string} text
 */
const getPHPOnly = text => {
  let docIdentifier = '';
  const docStart = '<<<';
  let inPHP = false;
  let inString = false;
  let inDoc = false;
  let inPHPComment = false;
  let phpCommentType = '';
  let whatString = ``;
  let whatDoc = '';
  const singleLineComment = '//';
  const multiLineCommentStart = '/*';
  const multiLineCommentEnd = '*/';
  let finalText = '';

  for (let i = 0; i < text.length; i += 1) {
    if (!inPHP) {
      if (text[i] === '<') {
        let tmpLen = 0;

        for (let j = 0; j < phpOpenTags.length; j += 1) {
          const tagLength = phpOpenTags[j].length;

          if (
            text.slice(i, i + tagLength) === phpOpenTags[j] &&
            (j > 0 || [' ', '\n', '\t', '\r'].includes(text[i + tagLength]))
          ) {
            tmpLen = tagLength;
            inPHP = true;
            break;
          }
        }

        if (inPHP) {
          finalText += ' '.repeat(tmpLen);
          i += tmpLen - 1;
          continue;
        }
      }

      if (['\t', '\n', '\r', ''].includes(text[i])) {
        finalText += text[i];
      } else {
        finalText += ' ';
      }
    } else if (inString || inDoc || inPHPComment) {
      if (inString) {
        if (text[i] === whatString && text[i - 1] !== '\\') {
          inString = false;
          whatString = '';
        }

        finalText += text[i];
      } else if (inDoc) {
        const docLen = docIdentifier.length;

        if (
          [' ', '\n', '\t'].includes(text[i - 1]) &&
          text.slice(i, i + docLen) === docIdentifier &&
          (text[i + docLen] === ';' || !/[a-zA-Z0-9_]$/gi.test(text[i + docLen]))
        ) {
          inDoc = false;
          docIdentifier = '';
          finalText += `${text.slice(i, i + docLen)}`;
          i += docLen - 1;
        } else {
          finalText += text[i];
        }
      } else if (inPHPComment) {
        if (phpCommentType === 'single' && ['\n'].includes(text[i])) {
          inPHPComment = false;
          phpCommentType = '';
          finalText += text[i];
          continue;
        } else if (
          phpCommentType === 'multi' &&
          text.slice(i, i + multiLineCommentEnd.length) === multiLineCommentEnd
        ) {
          inPHPComment = false;
          phpCommentType = '';
          finalText += multiLineCommentEnd;
          i += multiLineCommentEnd.length - 1;
          continue;
        }

        finalText += text[i];
      }
    } else if ([`"`, `'`].includes(text[i])) {
      inString = true;
      whatString = text[i];
      finalText += text[i];
    } else if (text.slice(i, i + docStart.length) === docStart) {
      inDoc = true;
      finalText += docStart;
      i += docStart.length;

      if (text[i] === "'") {
        whatDoc = 'now';
        finalText += "'";
        i += 1;
      } else {
        if (text[i] === '"') {
          finalText += '"';
          i += 1;
        }

        whatDoc = 'here';
      }

      while (i < text.length) {
        if (whatDoc === 'now' && text[i] === "'") {
          if (text[i] === "'") {
            finalText += text[i];
            break;
          }
        } else if (text[i] === '"') {
          finalText += text[i];
          break;
        } else if (['\n', ' ', '\t', '\r'].includes(text[i])) {
          finalText += text[i];
          break;
        }

        finalText += text[i];
        docIdentifier += text[i];
        i += 1;
      }
    } else if (text.slice(i, i + singleLineComment.length) === singleLineComment) {
      inPHPComment = true;
      phpCommentType = 'single';
      finalText += singleLineComment;
      i += singleLineComment.length - 1;
      continue;
    } else if (text.slice(i, i + multiLineCommentStart.length) === multiLineCommentStart) {
      inPHPComment = true;
      phpCommentType = 'multi';
      finalText += multiLineCommentStart;
      i += multiLineCommentStart.length - 1;
      continue;
    } else if (text[i] === '?' && text.slice(i, i + phpCloseTag.length) === phpCloseTag) {
      inPHP = false;
      const closeTagLen = phpCloseTag.length;
      finalText += `;${' '.repeat(closeTagLen - 1)}`;
      i += closeTagLen - 1;
    } else {
      finalText += text[i];
    }
  }

  return finalText;
};

module.exports = {
  getPHPOnly
};
