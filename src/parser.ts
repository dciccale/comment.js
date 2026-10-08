import path from 'node:path';
import { tags } from './tags/tags.js';
import { sourcePageNames } from './source-pages.js';
import type { CommentBlock, CommentMap, DocumentationData, DocumentationSection, FileMap, ParserSection, TocItem } from './types.js';

const START_COMMENT = /^\s*\/\*\\\s*$/;
const END_COMMENT = /^\s*\\\*\/\s*$/;
const ROW_DATA = /^\s*(\S)(?:(?!\n)\s(.*))?$/;
export interface ParserOptions { filemap: FileMap }
interface SectionNode {
  children: Map<string, SectionNode>;
  section?: DocumentationSection;
}

export class Parser {
  constructor(private options: ParserOptions) {}

  parse(filemap = this.options.filemap): DocumentationData {
    const root: SectionNode = { children: new Map() };
    const sourceNames = sourcePageNames(filemap);
    for (const blocks of Object.values(this.extract(filemap))) {
      for (const block of blocks) {
        const section = this.processBlock(block, sourceNames.get(block.filename) ?? 'index');
        let node = root;
        for (const part of section[0].name.split('.')) {
          let child = node.children.get(part);
          if (!child) {
            child = { children: new Map() };
            node.children.set(part, child);
          }
          node = child;
        }
        if (node.section) throw new Error(`Duplicate section: ${section[0].name}`);
        node.section = section;
      }
    }
    const sections: DocumentationSection[] = [];
    const toc: TocItem[] = [];
    const visit = (node: SectionNode, depth: number): void => {
      if (node.section) {
        const data = node.section[0];
        const isMethod = data.type?.includes('method') ?? false;
        data.brackets = isMethod ? methodBrackets(data.params) : '';
        sections.push(node.section);
        toc.push({ indent: depth - 1, name: data.name, type: data.type, brackets: isMethod ? '()' : '' });
      }
      for (const name of [...node.children.keys()].sort()) {
        const child = node.children.get(name);
        if (child) visit(child, depth + 1);
      }
    };
    visit(root, 0);
    const firstFile = Object.keys(filemap)[0];
    return { docsname: firstFile ? path.basename(firstFile) : undefined, sections, toc };
  }

  extract(filemap = this.options.filemap): CommentMap {
    const comments: CommentMap = Object.create(null);
    for (const [filename, content] of Object.entries(filemap)) {
      const lines = content.replace(/\r\n?/g, '\n').split('\n');
      for (let i = 0; i < lines.length; i += 1) {
        if (!START_COMMENT.test(lines[i])) continue;
        const start = i;
        const commentLines: string[] = [];
        i += 1;
        while (i < lines.length && !END_COMMENT.test(lines[i])) {
          commentLines.push(lines[i]);
          i += 1;
        }
        if (i === lines.length) throw new Error(`Unclosed comment block in ${filename}:${start + 1}`);
        (comments[filename] ??= []).push({ comment: commentLines.join('\n'), line: i + 2, filename });
      }
    }
    return comments;
  }

  processBlock(block: CommentBlock, srclink = path.basename(block.filename, path.extname(block.filename))): DocumentationSection {
    let section: ParserSection | undefined;
    for (const line of block.comment.split('\n')) {
      const row = line.match(ROW_DATA);
      if (!row) continue;
      const symbol = row[1];
      const value = row[2] ?? '';
      if (!section) {
        if (symbol !== '*' || !value.trim() || value.split('.').some((part) => !part.trim())) {
          throw new Error(`Expected a section name in ${block.filename}:${block.line}`);
        }
        const data = {
          name: value, title: value.replace(/\./g, '-'), line: block.line,
          filename: path.basename(block.filename), srclink, level: Math.min(value.split('.').length + 1, 6),
        };
        section = { data, lines: [data], mode: '' };
        continue;
      }
      const tag = tags.get(symbol);
      if (!tag || typeof tag === 'string') continue;
      tag.process(value, section);
      section.mode = tag.name;
    }
    if (!section) throw new Error(`Empty comment block in ${block.filename}:${block.line}`);
    return section.lines;
  }
}

function methodBrackets(params?: string[][]): string {
  if (!params?.length) return '()';
  return params.length === 1 ? `(${params[0].join(', ')})` : '(…)';
}
