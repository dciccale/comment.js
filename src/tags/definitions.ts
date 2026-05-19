import * as utils from '../utils/index.js';
import type { JsonItem, ParamItem, ParserSection, ReturnItem } from '../types.js';
import type { tags } from './tags.js';

const REGEX_OPTIONAL_PARAM = /#optional\s*/g;
const REGEX_PARAM_INFO = /(\s*[()]\s*)/;
const REGEX_TYPES = /\s*\|\s*/;
const REGEX_JSON_PARAM_INFO = /^\s*([^\(\s]+)\s*\(([^\)]+)\)\s*(.*?)\s*$/;
const REGEX_JSON_START = /\s*\{\s*$/;
const REGEX_JSON_END = /\s*\}\s*,?\s*$/;
const REGEX_OBJECT_TYPES = /\(([^\)]+)\)/;

type TagsRegistry = typeof tags;

export function defineTags(registry: TagsRegistry): void {
  registry.define('type', {
    symbol: '[',
    process(value, section) {
      value = utils._.format(value).replace(REGEX_OBJECT_TYPES, () => '');
      section.data.type = value.replace(/\s*\]\s*$/, '');
    },
  });

  registry.define('head', {
    symbol: '>',
    process(value, section) {
      section.current.push({ head: utils._.format(value) } as never);
    },
  });

  registry.define('text', {
    symbol: '*',
    single: true,
    process(value, section) {
      section.current.push({ text: utils._.format(value) } as never);
    },
  });

  registry.define('params', {
    symbol: '-',
    process(value, section) {
      let optional = false;
      const param: Partial<ParamItem> = {};

      section.data.params = section.data.params || [];

      if (section.mode !== this.name) {
        const host: ParamItem[] = [];
        section.data.params.push([]);
        section.current.push({ params: host } as never);
        section.current = host;
      }

      const sectionData = section.data.params[section.data.params.length - 1];
      value = value.replace(REGEX_OPTIONAL_PARAM, () => {
        optional = true;
        return '';
      });

      if (optional) {
        param.optional = true;
      }

      const desc = value.split(REGEX_PARAM_INFO);
      param.name = desc.shift() || '';
      sectionData.push(`${optional ? '[' : ''}${param.name}${optional ? ']' : ''}`);
      desc.shift();
      param.types = (desc.shift() || '').split(REGEX_TYPES);
      desc.shift();
      param.desc = utils._.format(desc.join('')) || '&#160;';
      (section.current as ParamItem[]).push(param as ParamItem);
    },
  });

  registry.define('json', {
    symbol: 'o',
    process(value, section) {
      const desc = value.match(REGEX_JSON_PARAM_INFO);
      const start = value.match(REGEX_JSON_START);
      const end = value.match(REGEX_JSON_END);
      let item: JsonItem | string = {};

      if (section.mode !== this.name) {
        const host: Array<JsonItem | string> = [];
        section.current.push({ json: host } as never);
        section.current = host;
      }

      if (desc) {
        desc.shift();
        const key = desc.shift() || '';
        const types = (desc.shift() || '').split(REGEX_TYPES);
        let optional = false;
        const text = (desc.shift() || '').replace(REGEX_OPTIONAL_PARAM, () => {
          optional = true;
          return '';
        });
        item = { key, types, desc: utils._.format(text) };
        if (optional) {
          item.optional = true;
        }
      } else if (!end) {
        item = value;
      }

      if (start) {
        item = { start: value };
      }
      if (end) {
        item = { end: value };
      }

      (section.current as Array<JsonItem | string>).push(item);
    },
  });

  registry.define('html', {
    symbol: '#',
    process(value, section) {
      section.current.push({ html: `${value}\n` } as never);
    },
  });

  registry.define('return', {
    symbol: '=',
    process(value, section) {
      const desc = value.split(REGEX_PARAM_INFO);
      const returns: ReturnItem = { desc };

      if (desc.length > 1) {
        desc.shift();
        desc.shift();
        returns.types = (desc.shift() || '').split(REGEX_TYPES);
        desc.shift();
      }

      returns.desc = desc;
      section.current.push({ return: returns } as never);
    },
  });

  registry.define('code', {
    symbol: '|',
    process(value, section) {
      if (section.mode !== this.name) {
        const host: string[] = [];
        section.current.push({ code: host } as never);
        section.current = host;
      }

      (section.current as string[]).push(value);
    },
  });
}
