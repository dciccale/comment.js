import { defineTags } from './definitions.js';
import type { ParserSection } from '../types.js';

export interface TagDefinition {
  symbol: string;
  single?: boolean;
  process(this: Tag, value: string, section: ParserSection): void;
}

export class Tag implements TagDefinition {
  symbol: string;
  single?: boolean;
  process: TagDefinition['process'];

  constructor(public name: string, definition: TagDefinition) {
    this.symbol = definition.symbol;
    this.single = definition.single;
    this.process = definition.process;
  }
}

const tagsBySymbol = new Map<string, Tag>();
const symbolsByName = new Map<string, string>();

export const tags = {
  define(name: string, definition: TagDefinition): Tag {
    const tag = new Tag(name, definition);
    tagsBySymbol.set(tag.symbol, tag);
    symbolsByName.set(name, tag.symbol);
    return tag;
  },

  get(q: string): Tag | string | null {
    return tagsBySymbol.get(q) ?? symbolsByName.get(q) ?? null;
  },
};

defineTags(tags);
