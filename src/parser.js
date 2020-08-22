/* eslint-disable no-unused-expressions */
const engine = require('php-parser');
const { removeShebang } = require('./utils');

class Parser {
  /**
   * Is php 7.0+
   * @param {boolean} isPhp7
   */
  constructor(isPhp7 = true) {
    this.functionGroups = [];
    // @ts-ignore
    // eslint-disable-next-line new-cap
    this.parser = new engine({
      parser: {
        extractDoc: true,
        php7: isPhp7
      },
      ast: {
        withPositions: true,
        withSource: true
      },
      lexer: {
        short_tags: true,
        asp_tags: true,
        all_tokens: true,
        comment_tokens: true
      }
    });
  }

  /**
   * @param {string} text
   */
  parse(text) {
    this.functionGroups = [];
    const astRoot = this.parser.parseCode(removeShebang(text));
    this.crawl(astRoot);
  }

  crawl(ast) {
    if (['call', 'new'].includes(ast.kind)) {
      try {
        this.parseArguments(ast);
        // eslint-disable-next-line no-empty
      } catch (err) {}
    }

    try {
      // eslint-disable-next-line no-unused-vars
      Object.entries(ast).forEach(([_, node]) => {
        if (node instanceof Object) {
          try {
            this.crawl(node);
            // eslint-disable-next-line no-empty
          } catch (err) {}
        }
      });
      // eslint-disable-next-line no-empty
    } catch (err) {}
  }

  parseArguments(obj) {
    const expressionLoc = obj.what.offset ? obj.what.offset.loc.start : obj.what.loc.end;
    const functionGroup = {
      name: '',
      args: [],
      line: parseInt(expressionLoc.line, 10) - 1,
      character: parseInt(expressionLoc.column, 10)
    };

    if (obj.what && obj.what.kind === 'classreference') {
      functionGroup.name = obj.what.name;
    }

    obj.arguments.forEach((arg, index) => {
      let argument = arg;

      while (argument.kind === 'bin' && argument.left) {
        argument = argument.left;
      }

      const startLoc = argument.loc.start;
      const endLoc = argument.loc.end;
      let argKind = argument.kind || '';

      if (
        argument.kind &&
        argument.kind === 'identifier' &&
        argument.name.name &&
        argument.name.name === 'null'
      ) {
        argKind = 'null';
      }

      functionGroup.args.push({
        key: index,
        start: {
          line: parseInt(startLoc.line, 10) - 1,
          character: parseInt(startLoc.column, 10)
        },
        end: {
          line: parseInt(endLoc.line, 10) - 1,
          character: parseInt(endLoc.column, 10)
        },
        name: argument.name || '',
        kind: argKind
      });
    });

    if (functionGroup.args.length && obj.what && obj.what.kind !== 'variable') {
      this.functionGroups.push(functionGroup);
    }
  }
}

module.exports = Parser;
