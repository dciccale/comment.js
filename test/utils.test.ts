import { describe, expect, test } from 'bun:test';
import * as util from '../src/utils/util.js';

describe('utility helpers', () => {
  test('formats markdown-like inline syntax and escaped text', () => {
    expect(util.format('Use `code` with @api.method and https://example.com/path')).toContain(
      '<code class="prettyprint">code</code>',
    );
    expect(util.format('Use `code` with @api.method and https://example.com/path')).toContain(
      '<a href="#api.method" class="cjs-link">api.method</a>',
    );
    expect(util.format('Use `code` with @api.method and https://example.com/path')).toContain(
      '<a href="https://example.com/path" rel="external">https://example.com/path</a>',
    );
    expect(util.format('<tag> & text')).toBe('&lt;tag> <em class="amp">&amp;</em> text');
    expect(util.format('')).toBe('');
  });

  test('iterates arrays and ignores non-arrays', () => {
    const seen: number[] = [];
    util.forEach([1, 2], (value) => {
      seen.push(value);
    });
    util.forEach(undefined, () => {
      seen.push(99);
    });
    expect(seen).toEqual([1, 2]);
  });

  test('extends, checks membership, hashes keys, and detects empty values', () => {
    expect(util.extend({ a: 1 } as Record<string, number>, undefined, { b: 2 })).toEqual({ a: 1, b: 2 });
    expect(util.has(['a'], 'a')).toBe(true);
    expect(util.has({ a: true }, 'a')).toBe(true);
    expect(util.hash(['a', 'b'], [1])).toEqual({ a: 1, b: true });
    expect(util.isEmpty(null)).toBe(true);
    expect(util.isEmpty('')).toBe(true);
    expect(util.isEmpty([])).toBe(true);
    expect(util.isEmpty({})).toBe(true);
    expect(util.isEmpty({ a: true })).toBe(false);
  });
});
