/* eslint-disable no-restricted-syntax */
/* eslint-disable import/no-unresolved */
const vscode = require('vscode');
const { printError } = require('./printer');
const { sameNameSign, isDefined } = require('./utils');
const { showTypeEnum } = require('./commands');

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

const resolveTypeHint = (showTypeState, args) => {
  const newArgs = args.map(arg => {
    const [type, label] = arg.split(' ');

    if (!isDefined(label)) {
      return type;
    }

    /**
     * Keep only the short name of the type
     * stripping away any namespace
     */
    const splittedType = type.split('\\');
    let finalType = splittedType[splittedType.length - 1];

    if (finalType.indexOf('?') === 0 && finalType.indexOf('|null') === -1) {
      // If param is optional and this is not already set
      finalType = `${finalType.replace('?', '')}|null`;
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
const getParamsNames = async (functionDictionary, functionGroup, editor) => {
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
    // Regex to extract param name/type from function definition
    let regExDef;

    if (showTypes === 'disabled') {
      regExDef = /(?<=\(.*)((\.\.\.)?(&)?\$[a-zA-Z0-9_]+)(?=.*\))/gims;
    } else {
      // Capture the types as well
      regExDef = /(?<=\(?)([^,$]+\$[a-zA-Z0-9_]+)(?=.*\))/gims;
    }

    let signature;
    const signatureHelp = await vscode.commands.executeCommand(
      'vscode.executeSignatureHelpProvider',
      editor.document.uri,
      new vscode.Position(functionGroup.args[0].start.line, functionGroup.args[0].start.character)
    );

    if (signatureHelp) {
      [signature] = signatureHelp.signatures;
    }

    // Regex to extract param name/type from function doc
    let regExDoc;

    if (showTypes === 'disabled') {
      regExDoc = /(?<=@param_ )(?:.*?)((\.\.\.)?(&)?\$[a-zA-Z0-9_]+)/;
    } else {
      // Capture the types as well
      regExDoc = /(?<=@param_ )(([^$])+(\.\.\.)?($)?\$[a-zA-Z0-9_]+)/;
    }

    // Signature helper available
    if (signature && signature.parameters) {
      try {
        args = signature.parameters.map(parameter => {
          /**
           * If there is a phpDoc for the parameter, use it as the doc
           * provides more types
           */
          if (parameter.documentation && parameter.documentation.value) {
            const docLabel = new RegExp(regExDoc.source, 'gims')
              .exec(parameter.documentation.value)[1]
              .replace('`', '')
              .trim();

            /**
             * Doc wrongfully shows variadic param type as array so we remove it
             */
            return docLabel.indexOf('[]') !== -1 && docLabel.indexOf('...') !== -1
              ? docLabel.replace('[]', '')
              : docLabel;
          }

          // Fallback to label
          const splittedLabel = parameter.label.split(' ');

          if (showTypes === 'disabled') {
            return splittedLabel[0];
          }

          /**
           * For cases with default param, like: '$glue = ""',
           * take only the param name
           */
          return splittedLabel[0].indexOf('$') !== -1
            ? splittedLabel[0]
            : splittedLabel.slice(0, 2).join(' ');
        });

        if (showTypes !== 'disabled') {
          args = resolveTypeHint(showTypes, args);
        }
      } catch (err) {
        printError(err);
      }
    } else {
      // Fallback on hover command
      let argsDef = [];

      try {
        const hoverCommand = await vscode.commands.executeCommand(
          'vscode.executeHoverProvider',
          editor.document.uri,
          new vscode.Position(functionGroup.line, functionGroup.character)
        );

        if (hoverCommand) {
          for (const hover of hoverCommand) {
            if (args.length) {
              break;
            }

            for (const content of hover.contents) {
              if (args.length) {
                break;
              }

              args = [
                ...new Set(
                  content.value.match(regExDoc).map(label => label.replace('`', '').trim())
                )
              ];

              if (showTypes !== 'disabled') {
                args = resolveTypeHint(showTypes, args);
              }

              // If no parameters annotations found, try a regEx that takes the
              // parameters from the function definition in hover content
              if (!argsDef.length) {
                argsDef = [...new Set(content.value.match(regExDef))];
              }
            }
          }

          if (!args || !args.length) {
            args = argsDef;
          }
        }
      } catch (err) {
        printError(err);
      }
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
            sameNameSign +
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

module.exports = getParamsNames;
