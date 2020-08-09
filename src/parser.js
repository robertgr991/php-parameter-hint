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
        withPositions: true
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
    const parsedCode = this.parser.parseEval(removeShebang(text).replace('<?php', ''));
    this.parseObject(parsedCode);
  }

  parseObject(obj) {
    if (Array.isArray(obj)) {
      obj.forEach(elem => {
        this.parseObject(elem);
      });

      return;
    }

    if (obj.kind) {
      if (['call', 'new'].includes(obj.kind)) {
        this.parseArguments(obj);
      }

      if (['function', 'method', 'catch', 'closure', 'arrowfunc'].includes(obj.kind)) {
        obj.body && this.parseObject(obj.body);
      }

      if (['array'].includes(obj.kind)) {
        if (obj.items) {
          this.parseObject(obj.items);
        }
      }

      if (['entry', 'yield'].includes(obj.kind)) {
        obj.key && this.parseObject(obj.key);
        obj.value && this.parseObject(obj.value);
      }

      if (['return', 'silent'].includes(obj.kind)) {
        obj.expr && this.parseObject(obj.expr);
      }

      if (['expressionstatement'].includes(obj.kind)) {
        if (Array.isArray(obj.expression)) {
          this.parseObject(obj.expression);
        } else {
          obj.expression && obj.expression.left && this.parseObject(obj.expression.left);
          obj.expression && obj.expression.right && this.parseObject(obj.expression.right);
          obj.expression && !obj.expression.left && this.parseObject(obj.expression);
        }
      }

      if (['include'].includes(obj.kind)) {
        obj.target && this.parseObject(obj.target);
      }

      if (['assign'].includes(obj.kind)) {
        obj.left && this.parseObject(obj.left);
        obj.right && this.parseObject(obj.right);
      }

      if (['eval'].includes(obj.kind)) {
        obj.source && this.parseObject(obj.source);
      }

      if (['isset', 'unset'].includes(obj.kind)) {
        obj.variables && this.parseObject(obj.variables);
      }

      if (['bin'].includes(obj.kind)) {
        obj.left && this.parseObject(obj.left);
        obj.right && this.parseObject(obj.right);
      }

      if (['break', 'continue'].includes(obj.kind)) {
        obj.level && this.parseObject(obj.level);
      }

      if (['switch', 'if', 'while', 'case', 'do'].includes(obj.kind)) {
        obj.test && this.parseObject(obj.test);
        obj.body && this.parseObject(obj.body);
      }

      if (['if'].includes(obj.kind)) {
        obj.alternate && this.parseObject(obj.alternate);
      }

      if (['encapsed', 'nowdoc', 'yieldfrom'].includes(obj.kind)) {
        obj.value && this.parseObject(obj.value);
      }

      if (['retif'].includes(obj.kind)) {
        obj.test && this.parseObject(obj.test);
        obj.trueExpr && this.parseObject(obj.trueExpr);
        obj.falseExpr && this.parseObject(obj.falseExpr);
      }

      if (['program', 'block', 'namespace'].includes(obj.kind)) {
        if (obj.children) {
          this.parseObject(obj.children);
        }
      }

      if (['foreach'].includes(obj.kind)) {
        obj.source && this.parseObject(obj.source);
        obj.body && this.parseObject(obj.body);
      }

      if (['echo'].includes(obj.kind)) {
        obj.expressions && this.parseObject(obj.expressions);
      }

      if (['empty', 'print', 'encapsedpart'].includes(obj.kind)) {
        obj.expression && this.parseObject(obj.expression);
      }

      if (['try'].includes(obj.kind)) {
        obj.body && this.parseObject(obj.body);
        obj.catches && this.parseObject(obj.catches);
        obj.always && this.parseObject(obj.always);
      }

      if (['for'].includes(obj.kind)) {
        if (Array.isArray(obj.init)) {
          this.parseObject(obj.init);
        } else {
          obj.init && obj.init.left && this.parseObject(obj.init.left);
          obj.init && obj.init.right && this.parseObject(obj.init.right);
        }

        obj.test && this.parseObject(obj.test);

        if (Array.isArray(obj.increment)) {
          this.parseObject(obj.increment);
        } else {
          obj.increment && obj.increment.left && this.parseObject(obj.increment.left);
          obj.increment && obj.increment.right && this.parseObject(obj.increment.right);
        }

        obj.body && this.parseObject(obj.body);
      }

      if (['class', 'trait'].includes(obj.kind)) {
        if (obj.body) {
          this.parseObject(obj.body);
        }
      }

      if (['exit'].includes(obj.kind)) {
        if (Array.isArray(obj.status)) {
          this.parseObject(obj.status);
        } else {
          obj.status && obj.status.left && this.parseObject(obj.status.left);
          obj.status && obj.status.right && this.parseObject(obj.status.right);
          obj.status && this.parseObject(obj.status);
        }
      }
    }

    obj.what && this.parseObject(obj.what);
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
      this.parseObject(argument);

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
