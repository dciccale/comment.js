import { describe, expect, test } from 'bun:test';
import { Parser } from '../src/parser.js';

describe('Parser', () => {
  test('extracts comment.js blocks into ordered sections and toc entries', () => {
    const parser = new Parser({
      filemap: {
        '/tmp/example.ts': `const hidden = true;
/*\\
* api.greet
[ method ]
> Greeting helper
* Formats a greeting for \`name\`.
- name (string) The name to greet
= (string) The greeting
\\*/
export function greet(name: string) {
  return 'Hi ' + name;
}
`,
      },
    });

    const data = parser.parse();

    expect(data.docsname).toBe('example.ts');
    expect(data.toc).toEqual([{ indent: 1, name: 'api.greet', type: 'method', brackets: '()' }]);
    expect(data.sections[0][0]).toMatchObject({
      name: 'api.greet',
      filename: 'example.ts',
      type: 'method',
      brackets: '(name)',
    });
  });

  test('processes all supported block tags', () => {
    const parser = new Parser({
      filemap: {
        '/tmp/full.ts': `/*\\
* api.full
[ method (string|number) ]
> Details & links
* Calls @api.other with https://example.com and \`value\`.
# <strong>raw</strong>
- options (object) #optional
o {
o  name (string) #optional User name
o  active (boolean) Active flag
o }
= No explicit return type
| const first = true;
| const second = false;
\\*/`,
      },
    });

    const data = parser.parse();
    const section = data.sections[0];

    expect(section[0]).toMatchObject({ name: 'api.full', type: 'method' });
    expect(section).toContainEqual({ head: 'Details <em class="amp">&amp;</em> links' });
    expect(section).toContainEqual({ html: '<strong>raw</strong>\n' });
    expect(section).toContainEqual({
      params: [{ name: 'options', types: ['object'], desc: '&#160;', optional: true }],
    });
    expect(section).toContainEqual({
      json: [
        { start: '{' },
        { key: 'name', types: ['string'], desc: 'User name', optional: true },
        { key: 'active', types: ['boolean'], desc: 'Active flag' },
        { end: '}' },
      ],
    });
    expect(section).toContainEqual({ return: { desc: 'No explicit return type' } });
    expect(section).toContainEqual({ code: ['const first = true;', 'const second = false;'] });
  });
});

describe('Parser regressions', () => {
  const block = (name: string, body = '') => `/*\\\n* ${name}\n${body}\n\\*/\nconst implementation = true;`;

  test('supports built-in property names without changing Object.prototype', () => {
    const names = ['constructor', 'toString', '__proto__', 'api.constructor', '__proto__.nested'];
    const before = Object.getOwnPropertyNames(Object.prototype);
    const filemap = Object.fromEntries(names.map((name, index) => [`/${index}.ts`, block(name)]));
    expect(new Parser({ filemap }).parse().toc.map((item) => item.name).sort()).toEqual([...names].sort());
    expect(Object.getOwnPropertyNames(Object.prototype)).toEqual(before);
  });
  test('orders parents before children across files', () => {
    const filemap = { '/first.ts': block('api.child'), '/second.ts': block('api') };
    expect(new Parser({ filemap }).parse().toc.map((item) => item.name)).toEqual(['api', 'api.child']);
  });
  test('returns independent results when reused', () => {
    const parser = new Parser({ filemap: { '/old.ts': block('old') } });
    const first = parser.parse();
    const second = parser.parse({ '/new.ts': block('new') });
    expect(first.toc.map((item) => item.name)).toEqual(['old']);
    expect(second.toc.map((item) => item.name)).toEqual(['new']);
  });
  test('formats and escapes typed and untyped return descriptions', () => {
    const filemap = { '/api.ts': block('api', '= (string|number) Use `value` from @api.other and <tag>\n= plain `code`') };
    const lines = new Parser({ filemap }).parse().sections[0];
    expect(lines).toContainEqual({ return: { types: ['string', 'number'], desc: 'Use <code class="prettyprint">value</code> from <a href="#api.other" class="cjs-link">api.other</a> and &lt;tag>' } });
    expect(lines).toContainEqual({ return: { desc: 'plain <code class="prettyprint">code</code>' } });
  });
  test('retains overload signatures and nested object examples', () => {
    const filemap = { '/api.ts': block('api', '[ method ]\n- first (string) First\n- second (number) #optional Second\n> Overload\n- options (object) Options\no {\no nested {\no value (boolean) #optional Value\no }\no }\n| one\n| two') };
    const section = new Parser({ filemap }).parse().sections[0];
    expect(section[0].brackets).toBe('(…)');
    expect(section[0].params).toEqual([['first', '[second]'], ['options']]);
    expect(section).toContainEqual({ code: ['one', 'two'] });
  });
  test('normalizes line endings and links to the implementation line', () => {
    const source = block('api').replace(/\n/g, '\r\n');
    const section = new Parser({ filemap: { '/api.ts': source } }).parse().sections[0];
    expect(section[0].line).toBe(5);
  });
  test('caps deeply nested section headings at h6', () => {
    expect(new Parser({ filemap: { '/api.ts': block('a.b.c.d.e.f.g') } }).parse().sections[0][0].level).toBe(6);
  });
  test('rejects unclosed, empty, untitled, duplicate, and malformed blocks', () => {
    for (const content of ['/*\\\n* api', '/*\\\n\\*/', block(''), block('api', '- bad'), block('api') + '\n' + block('api'), '/*\\\n- arg (string) Missing title\n\\*/']) {
      expect(() => new Parser({ filemap: { '/bad.ts': content } }).parse()).toThrow();
    }
  });
});
