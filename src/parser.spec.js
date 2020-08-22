const { describe, it } = require('mocha');
const { expect } = require('chai');
const Parser = require('./parser');

describe('Parser', () => {
  const parser = new Parser(true);

  describe('parse', () => {});
  it('should correctly parse and store the function groups from text', () => {
    // with function groups
    const text = `<?php
    $list = join(', ', [1, 2, 3]);
  `;
    parser.parse(text);
    const { functionGroups } = parser;
    const expectedFunctionGroups = [
      {
        name: '',
        args: [
          {
            key: 0,
            start: {
              line: 1,
              character: 17
            },
            end: {
              line: 1,
              character: 21
            },
            name: '',
            kind: 'string'
          },
          {
            key: 1,
            start: {
              line: 1,
              character: 23
            },
            end: {
              line: 1,
              character: 32
            },
            name: '',
            kind: 'array'
          }
        ],
        line: 1,
        character: 16
      }
    ];
    expect(functionGroups).to.have.lengthOf(1);
    expect(functionGroups).to.deep.equal(expectedFunctionGroups);
  });
  it('should parse the text and store empty array because there are no function groups', () => {
    // without function groups
    const text = `<?php
      $a = 5;
    `;
    parser.parse(text);
    const { functionGroups } = parser;
    expect(functionGroups).to.have.lengthOf(0);
  });
  it('should correctly parse and store function groups when php code is combined with html', () => {
    // with html
    const text = `
      <p>List: <?php echo join(', ', [1, 2, 3])?></p>
    `;
    parser.parse(text);
    const { functionGroups } = parser;
    const expectedFunctionGroups = [
      {
        name: '',
        args: [
          {
            key: 0,
            start: {
              line: 1,
              character: 31
            },
            end: {
              line: 1,
              character: 35
            },
            name: '',
            kind: 'string'
          },
          {
            key: 1,
            start: {
              line: 1,
              character: 37
            },
            end: {
              line: 1,
              character: 46
            },
            name: '',
            kind: 'array'
          }
        ],
        line: 1,
        character: 30
      }
    ];
    expect(functionGroups).to.have.lengthOf(1);
    expect(functionGroups).to.deep.equal(expectedFunctionGroups);
  });
  it('should save all the function groups from the text', () => {
    // with multiple function groups
    const text = `<?php
      $type = strtolower('USERS');
      str_replace('users', 'user', $type);
      echo $type;
    `;
    parser.parse(text);
    const { functionGroups } = parser;
    const expectedFunctionGroups = [
      {
        name: '',
        args: [
          {
            key: 0,
            start: {
              line: 1,
              character: 25
            },
            end: {
              line: 1,
              character: 32
            },
            name: '',
            kind: 'string'
          }
        ],
        line: 1,
        character: 24
      },
      {
        name: '',
        args: [
          {
            key: 0,
            start: {
              line: 2,
              character: 18
            },
            end: {
              line: 2,
              character: 25
            },
            name: '',
            kind: 'string'
          },
          {
            key: 1,
            start: {
              line: 2,
              character: 27
            },
            end: {
              line: 2,
              character: 33
            },
            name: '',
            kind: 'string'
          },
          {
            key: 2,
            start: {
              line: 2,
              character: 35
            },
            end: {
              line: 2,
              character: 40
            },
            name: 'type',
            kind: 'variable'
          }
        ],
        line: 2,
        character: 17
      }
    ];
    expect(functionGroups).to.have.lengthOf(2);
    expect(functionGroups).to.deep.equal(expectedFunctionGroups);
  });
  it('should throw when there is a syntax error', () => {
    const text = `<?php
      $x = 5
      $y = 6;
    `;
    expect(() => {
      parser.parse(text);
    }).to.throw();
  });
  it('should correctly parse the text and save the function groups when php short tags are used', () => {
    // with short tags
    const text = `
      <p>Name: <?=ucfrst('unknown')?></p>
      <p>Age: <? echo abs(-35)?></p>
    `;
    parser.parse(text);
    const { functionGroups } = parser;
    const expectedFunctionGroups = [
      {
        name: '',
        args: [
          {
            key: 0,
            start: {
              line: 1,
              character: 25
            },
            end: {
              line: 1,
              character: 34
            },
            name: '',
            kind: 'string'
          }
        ],
        line: 1,
        character: 24
      },
      {
        name: '',
        args: [
          {
            key: 0,
            start: {
              line: 2,
              character: 26
            },
            end: {
              line: 2,
              character: 29
            },
            name: '',
            kind: 'unary'
          }
        ],
        line: 2,
        character: 25
      }
    ];
    expect(functionGroups).to.have.lengthOf(2);
    expect(functionGroups).to.deep.equal(expectedFunctionGroups);
  });
});
