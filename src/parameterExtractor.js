/* eslint-disable no-restricted-syntax */
/* eslint-disable import/no-unresolved */
const vscode = require('vscode');
const { sameNamePlaceholder, isDefined } = require('./utils');
const { showTypeEnum } = require('./commands');
const signature = require('./providers/signature');
const hover = require('./providers/hover');

const isVariadic = label => label.substr(0, 3) === '...' || label.substr(0, 4) === '&...';

const getVariadic = label => (label.substr(0, 3) === '...' ? '...' : '&...');

const getNameAfterVariadic = label =>
  label.substr(0, 3) === '...' ? label.slice(3) : label.replace('...', '');

const filterOnlyTypeLabels = args =>
  args
    .map(label => {
      const labels = label.split(' ');

      if (labels.length > 1) {
        /**
         * Keep the splat operator for rest param even when
         * not showing param name to be able to correctly decorate the arguments
         */
        return isVariadic(labels[1]) ? `${labels[0]} ${getVariadic(labels[1])}` : labels[0];
      }

      return '';
    })
    .filter(label => label !== '');

const resolveTypeHint = (showTypeState, args, showTypes) => {
  const newArgs = args.map(arg => {
    // eslint-disable-next-line prefer-const
    let [type, label] = arg.split(' ');

    if (!isDefined(label)) {
      return type;
    }

    let finalType = type;
    const showFullType = vscode.workspace.getConfiguration('phpParameterHint').get('showFullType');

    if (!showFullType) {
      /**
       * Keep only the short name of the type
       * stripping away any namespace
       */
      const splittedType = type.split('\\');
      finalType = splittedType[splittedType.length - 1];
    }

    if (type.indexOf('?') === 0 && finalType.indexOf('|null') === -1) {
      // If param is optional and this is not already set
      finalType = `${finalType}|null`;
    }

    finalType = finalType.replace('?', '');

    if (finalType[0] === '\\') {
      finalType = finalType.slice(1);
    }

    const collapseTypeWhenEqual = vscode.workspace
      .getConfiguration('phpParameterHint')
      .get('collapseTypeWhenEqual');
    const cleanLabel = label.slice(1); // without dollar sign

    if (collapseTypeWhenEqual && finalType === cleanLabel) {
      return showTypes === 'type' ? `${finalType} ${label}` : `${label}`;
    }

    if (finalType === cleanLabel) {
      label = `$${label}`;
    }

    return `${finalType} ${label}`;
  });

  return showTypeState === 'type' ? filterOnlyTypeLabels(newArgs) : newArgs;
};

/**
 * Get the parameter name
 *
 * @param {Map<string, Array<string>>} functionDictionary
 * @param {Object} functionGroup
 * @param {vscode.TextEditor} editor
 */
const getHints = async (functionDictionary, functionGroup, editor) => {
  const finalArgs = [];
  let args = [];
  const collapseHintsWhenEqual = vscode.workspace
    .getConfiguration('phpParameterHint')
    .get('collapseHintsWhenEqual');
  const hintTypeName = vscode.workspace.getConfiguration('phpParameterHint').get('hintTypeName');
  const showTypes = showTypeEnum[hintTypeName];

  // If parameters group is memoized, simply return it
  if (functionGroup.name && functionDictionary.has(functionGroup.name)) {
    args = functionDictionary.get(functionGroup.name);
  } else {
    // First try to get the args from the Signature provider
    args = await signature.getArgs(
      editor,
      functionGroup.args[0].start.line,
      functionGroup.args[0].start.character,
      showTypes
    );

    if (!args.length) {
      // Fallback on Hover provider
      args = await hover.getArgs(editor, functionGroup.line, functionGroup.character, showTypes);
    }

    if (args.length && showTypes !== 'disabled') {
      args = resolveTypeHint(showTypes, args, showTypes);
    }

    // Memoise parameters group for this function
    if (functionGroup.name && args && args.length) {
      functionDictionary.set(functionGroup.name, args);
    }
  }

  if (args && args.length) {
    // Check if there is a rest parameter and return the parameter names in array-like style
    let hasRestParameter = false;
    let restParameterIndex = -1;
    let restParameterName = '';
    let restParameterType = '';
    const argsLength = args.length;
    // If there is a rest parameter, set it's details
    const setHasRest = (index, name, type = '') => {
      hasRestParameter = true;
      restParameterIndex = index;
      restParameterName = name;
      restParameterType = type;
    };

    args = args.map((arg, index) => {
      if (showTypes === 'disabled') {
        if (isVariadic(arg)) {
          setHasRest(index, getNameAfterVariadic(arg));

          return `${restParameterName}[0]`;
        }
      } else {
        let [type, name] = arg.split(' ');

        if (!isDefined(name)) {
          name = type;
          type = '';
        }

        if (showTypes === 'type') {
          if (isVariadic(name)) {
            /**
             * If the variadic params are set by reference,
             * set it as param name to show the reference on the following params
             */
            const reference = name.indexOf('&') === 0 ? '&' : '';
            setHasRest(index, reference, type);

            return `${type ? `${type} ${reference}[0]` : ''}`;
          }
        } else if (isVariadic(name)) {
          setHasRest(index, getNameAfterVariadic(name), type);

          return `${type ? `${type} ` : ''}${restParameterName}[0]`;
        }
      }

      return arg;
    });

    args = args.filter(arg => arg !== '');
    let groupArgsCount = 0;

    // Construct the final params hints
    for (
      let index = functionGroup.args[0].key;
      index < functionGroup.args[functionGroup.args.length - 1].key + 1;
      index += 1
    ) {
      if (index === argsLength && !hasRestParameter) {
        break;
      }

      const groupArg = functionGroup.args[groupArgsCount];
      const arg = args[index] || '';
      const finalArg = {};
      const groupArgStart = new vscode.Position(groupArg.start.line, groupArg.start.character);
      const groupArgEnd = new vscode.Position(groupArg.end.line, groupArg.end.character);

      finalArg.range = new vscode.Range(groupArgStart, groupArgEnd);
      finalArg.name = arg;

      // If key is bigger than the arguments length, check if there was a rest
      // parameter before and name it appropriately
      if (index >= argsLength) {
        finalArg.name = `${
          showTypes === 'disabled' ? '' : `${restParameterType} `
        }${restParameterName}[${index - restParameterIndex}]`;
      }

      /**
       * If collapse hints is enabled,
       * don't show the parameter name if it matches
       * with the variable name
       */
      if (collapseHintsWhenEqual && groupArg.name) {
        const squareBracketIndex = finalArg.name.indexOf('[');
        const whereSquareBracket =
          squareBracketIndex === -1 ? finalArg.name.length : squareBracketIndex;
        const dollarSignIndex = finalArg.name.indexOf('$');

        if (finalArg.name.substring(dollarSignIndex + 1, whereSquareBracket) === groupArg.name) {
          finalArg.name =
            finalArg.name.substring(0, dollarSignIndex) +
            sameNamePlaceholder +
            finalArg.name.substring(whereSquareBracket);
        }
      }

      finalArgs.push(finalArg);
      groupArgsCount += 1;
    }

    return finalArgs;
  }

  throw new Error('No arguments');
};

module.exports = getHints;
