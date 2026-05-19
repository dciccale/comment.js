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
    expect(section).toContainEqual({ return: { desc: ['No explicit return type'] } });
    expect(section).toContainEqual({ code: ['const first = true;', 'const second = false;'] });
  });
});
