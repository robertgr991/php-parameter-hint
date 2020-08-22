// Regex to extract param name/type from function definition
const regExDef = /(?<=\(.*)((\.\.\.)?(&)?\$[a-zA-Z0-9_]+)(?=.*\))/gims;

// Capture the types as well
const regExDefWithTypes = /(?<=\([^(]*)([^,]*(\.\.\.)?(&)?\$[a-zA-Z0-9_]+)(?=.*\))/gims;

// Regex to extract param name/type from function doc
const regExDoc = /(?<=@param_ )(?:.*?)((\.\.\.)?(&)?\$[a-zA-Z0-9_]+)/gims;
// Capture the types as well
const regExDocWithTypes = /(?<=@param_ )(([^$])+(\.\.\.)?($)?\$[a-zA-Z0-9_]+)/gims;

const getDocRegex = showTypes => {
  if (showTypes === 'disabled') {
    return regExDoc;
  }

  return regExDocWithTypes;
};

const getDefRegex = showTypes => {
  if (showTypes === 'disabled') {
    return regExDef;
  }

  return regExDefWithTypes;
};

module.exports = {
  getDocRegex,
  getDefRegex
};
