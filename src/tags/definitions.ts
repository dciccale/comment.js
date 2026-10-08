import { format } from '../utils/util.js';
import type { JsonItem, ParamItem } from '../types.js';
import type { tags } from './tags.js';

const OPTIONAL = /#optional\s*/g;
const TYPES = /\s*\|\s*/;
const PARAM = /^\s*(\S+)\s*\(([^)]+)\)\s*(.*)$/;

export function defineTags(registry: typeof tags): void {
  registry.define('type', {
    symbol: '[',
    process(value, section) {
      section.data.type = format(value.replace(/\(([^)]+)\)/, '').replace(/\s*\]\s*$/, '').trim());
    },
  });
  registry.define('head', { symbol: '>', process(value, section) { section.lines.push({ head: format(value) }); } });
  registry.define('text', { symbol: '*', single: true, process(value, section) { section.lines.push({ text: format(value) }); } });
  registry.define('html', { symbol: '#', process(value, section) { section.lines.push({ html: `${value}\n` }); } });
  registry.define('params', {
    symbol: '-',
    process(value, section) {
      const match = value.match(PARAM);
      if (!match) throw new Error(`Invalid parameter in ${section.data.name}: ${value}`);
      const optional = value.includes('#optional');
      const param: ParamItem = {
        name: match[1], types: match[2].split(TYPES), desc: format(match[3].replace(OPTIONAL, '')) || '&#160;',
        ...(optional ? { optional: true } : {}),
      };
      const last = section.lines.at(-1);
      if (section.mode === this.name && last && 'params' in last && !('name' in last)) {
        last.params.push(param);
      } else {
        section.lines.push({ params: [param] });
        (section.data.params ??= []).push([]);
      }
      section.data.params?.at(-1)?.push(optional ? `[${param.name}]` : param.name);
    },
  });
  registry.define('json', {
    symbol: 'o',
    process(value, section) {
      const match = value.match(PARAM);
      let item: JsonItem | string = value;
      if (/\s*\{\s*$/.test(value)) item = { start: value };
      else if (/\s*\}\s*,?\s*$/.test(value)) item = { end: value };
      else if (match) item = {
        key: match[1], types: match[2].split(TYPES), desc: format(match[3].replace(OPTIONAL, '')),
        ...(match[3].includes('#optional') ? { optional: true } : {}),
      };
      const last = section.lines.at(-1);
      if (section.mode === this.name && last && 'json' in last) last.json.push(item);
      else section.lines.push({ json: [item] });
    },
  });
  registry.define('return', {
    symbol: '=',
    process(value, section) {
      const match = value.match(/^\s*\(([^)]+)\)\s*(.*)$/);
      section.lines.push({ return: {
        ...(match ? { types: match[1].split(TYPES) } : {}),
        desc: format(match ? match[2] : value),
      } });
    },
  });
  registry.define('code', {
    symbol: '|',
    process(value, section) {
      const last = section.lines.at(-1);
      if (section.mode === this.name && last && 'code' in last) last.code.push(value);
      else section.lines.push({ code: [value] });
    },
  });
}
