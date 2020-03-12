/* eslint-disable */
const engine = require('php-parser');

class Parser {
  /**
   * Is php 7.0+
   * @param {boolean} isPhp7
   */
  constructor(isPhp7 = true) {
    this.phpArguments = [];
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
   * PHP code without tags
   * @param {string} code
   */
  parse(code) {
    this.phpArguments = [];
    const parsedCode = this.parser.parseEval(code);
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

      if (['function', 'method', 'catch', 'closure'].includes(obj.kind)) {
        obj.body && this.parseObject(obj.body);
      }

      if (['array'].includes(obj.kind)) {
        if (obj.items) {
          if (Array.isArray(obj.items)) {
            obj.items.forEach(item => {
              this.parseObject(item);
            });
          } else {
            this.parseObject(obj.items);
          }
        }
      }

      if (['entry', 'yield'].includes(obj.kind)) {
        obj.key && this.parseObject(obj.key);
        obj.value && this.parseObject(obj.value);
      }

      if (['return'].includes(obj.kind)) {
        obj.expr && this.parseObject(obj.expr);
      }

      if (['expressionstatement'].includes(obj.kind)) {
        if (Array.isArray(obj.expression)) {
          this.parseObject(obj.expression);
        } else {
          obj.expression && obj.expression.left && this.parseObject(obj.expression.left);
          obj.expression && obj.expression.right && this.parseObject(obj.expression.right);
          obj.expression &&
            !obj.expression.left &&
            obj.expression &&
            this.parseObject(obj.expression);
        }
      }

      if (['include'].includes(obj.kind)) {
        obj.target && this.parseObject(obj.target);
      }

      if (['assign'].includes(obj.kind)) {
        obj.left && this.parseObject(obj.left);
        obj.right && this.parseObject(obj.right);
      }

      if (['isset', 'unset'].includes(obj.kind)) {
        obj.variables && this.parseObject(obj.variables);
      }

      if (['bin'].includes(obj.kind)) {
        obj.left && this.parseObject(obj.left);
        obj.right && this.parseObject(obj.right);
      }

      if (['switch', 'if', 'while', 'case', 'do'].includes(obj.kind)) {
        obj.test && this.parseObject(obj.test);
        obj.body && this.parseObject(obj.body);
      }

      if (['if'].includes(obj.kind)) {
        obj.alternate && this.parseObject(obj.alternate);
      }

      if (['retif'].includes(obj.kind)) {
        obj.test && this.parseObject(obj.test);
        obj.trueExpr && this.parseObject(obj.trueExpr);
        obj.falseExpr && this.parseObject(obj.falseExpr);
      }

      if (['program', 'block'].includes(obj.kind)) {
        if (obj.children) {
          if (Array.isArray(obj.children)) {
            obj.children.forEach(child => {
              this.parseObject(child);
            });
          } else {
            this.parseObject(obj.children);
          }
        }
      }

      if (['foreach'].includes(obj.kind)) {
        obj.source && this.parseObject(obj.source);
        obj.body && this.parseObject(obj.body);
      }

      if (['echo'].includes(obj.kind)) {
        obj.expressions && this.parseObject(obj.expressions);
      }

      if (['empty', 'print'].includes(obj.kind)) {
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
          if (Array.isArray(obj.body)) {
            obj.body.forEach(classStatement => {
              this.parseObject(classStatement);
            });
          } else {
            this.parseObject(obj.body);
          }
        }
      }

      if (['exit'].includes(obj.kind)) {
        if (Array.isArray(obj.status)) {
          this.parseObject(obj.status);
        } else {
          obj.status && obj.status.left && this.parseObject(obj.status.left);
          obj.status && obj.status.right && this.parseObject(obj.status.right);
        }
      }
    }

    obj.what && this.parseObject(obj.what);
  }

  parseArguments(obj) {
    obj.arguments.forEach((arg, index) => {
      this.parseObject(arg);
      const startLoc = arg.loc.start;
      const endLoc = arg.loc.end;
      const expressionLoc = obj.what.offset ? obj.what.offset.loc.start : obj.what.loc.end;
      const phpArgument = {
        expression: {
          line: parseInt(expressionLoc.line, 10) - 1,
          character: parseInt(expressionLoc.column, 10)
        },
        key: index,
        start: {
          line: parseInt(startLoc.line, 10) - 1,
          character: parseInt(startLoc.column, 10)
        },
        end: {
          line: parseInt(endLoc.line, 10) - 1,
          character: parseInt(endLoc.column, 10)
        }
      };

      this.phpArguments.push(phpArgument);
    });
  }
}

module.exports = Parser;
