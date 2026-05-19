import * as utils from '../utils/index.js';
import { defineTags } from './definitions.js';
import type { ParserSection } from '../types.js';

export interface TagDefinition {
  symbol: string;
  single?: boolean;
  process(this: Tag, value: string, section: ParserSection): void;
}

export class Tag implements TagDefinition {
  symbol!: string;
  single?: boolean;
  process!: (value: string, section: ParserSection) => void;

  constructor(public name: string, definition: TagDefinition) {
    utils._.extend(this, definition as unknown as Record<string, unknown>);
  }
}

const tagsBySymbol: Record<string, Tag> = {};
const symbolsByName: Record<string, string> = {};

export const tags = {
  define(name: string, definition: TagDefinition): Tag {
    const tag = new Tag(name, definition);
    tagsBySymbol[tag.symbol] = tag;
    symbolsByName[name] = tag.symbol;
    return tag;
  },

  get(q: string): Tag | string | null {
    return utils._.has(tagsBySymbol, q) ? tagsBySymbol[q] : utils._.has(symbolsByName, q) ? symbolsByName[q] : null;
  },
};

defineTags(tags);
