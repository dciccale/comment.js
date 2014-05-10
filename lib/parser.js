/*!
 * comment.js
 * Copyright (c) 2014 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/comment.js/blob/master/LICENSE.txt
 */

'use strict';

var path = require('path');
var tags = require('./tags/tags');
var REGEX_START_COMMENT = /^\s*\/\*\\\s*$/;
var REGEX_END_COMMENT = /^\s*\\\*\/\s*$/;
var REGEX_ROW_DATA = /^\s*(\S)(?:(?!\n)\s(.*))?$/;
var REGEX_LINES = /\n/;

var Parser = function (options) {
  this.tags = tags;
  this.filemap = options.filemap;
  this.sections = [];
  this.section = {
    data: {},
    current: [],
    prev: [],
    mode: ''
  };
  this.commentmap = {};
  this.toc = [];
  this.utoc = {};
  this.tocData = {};
  this.blockData = {};
  this.lvl = [];
  this.root = {};
  this.pointer = null;
};

Parser.prototype.parse = function (filemap) {
  filemap = filemap || this.filemap;

  this.transform(this.extract(filemap));

  return {
    docsname: this.docsname,
    sections: this.sections,
    toc: this.toc
  };
};

// Extract all comment blocks from a file
Parser.prototype.extract = function (filemap) {
  var filename, lines, l, commentlines, comment, i, linenum, line, content, docsname;

  filemap = filemap || this.filemap;

  for (filename in filemap) {

    // The docs name uses the first file name (to improve)
    docsname = docsname || filename;

    // Normalize line endings
    content = filemap[filename].replace(/\r\n?/gm, '\n');

    lines = content.split(REGEX_LINES);
    l = lines.length;

    // Parse each line
    for (i = 0; i < l; i++) {
      line = lines[i];

      if (REGEX_START_COMMENT.test(line)) {
        commentlines = [];

        while (i < l && !REGEX_END_COMMENT.test(line)) {
          commentlines.push(line);
          i++;
          line = lines[i];
          linenum = i + 2;
        }

        // Remove /*\
        commentlines.shift();

        comment = commentlines.join('\n');
        this.commentmap[filename] = this.commentmap[filename] || [];
        this.commentmap[filename].push({comment: comment, line: linenum, filename: filename});
      }
    }
  }

  this.docsname = path.basename(docsname);

  return this.commentmap;
};

// Process a full comment block, line by line
Parser.prototype.processblock = function (block) {
  var blocklines = block.comment.split(REGEX_LINES);
  var l = blocklines.length;
  var firstline = false;
  var i, j, ll, line, data, symbol, value, tag, title;

  for (i = 0; i < l; i++) {
    line = blocklines[i];
    data = line.match(REGEX_ROW_DATA);

    if (i === 0) {
      firstline = true;
      this.pointer = this.root;
    }

    if (data) {
      symbol = data[1];
      value = data[2];

      if (symbol === tags.get('text') && firstline) {
        firstline = false;

        // Get namespaces
        title = value.split('.');
        ll = title.length;
        for (j = 0; j < ll; j++) {
          this.pointer = this.pointer[title[j]] = this.pointer[title[j]] || {};
        }

        this.section.data = {
          name: value,
          title: value.replace(/\./g, '-'),
          line: block.line,
          filename: path.basename(block.filename),
          srclink: path.basename(block.filename, path.extname(block.filename)),
          level: ++title.length,
        };

        this.section.current = this.section.prev = [this.section.data];

      } else {
        tag = tags.get(symbol);

        // Change the mode when not matching the current one
        if (this.section.mode !== tag.name) {
          this.section.current = this.section.prev;
        }

        // Process the value
        tag.process(value, this.section);

        this.section.mode = tag.name;
      }
    }
  }

  // Map the section data by name to generate the toc later
  this.tocData[this.section.data.name] = this.section.data;

  // Map each section by name to be able to order it later according the toc
  this.blockData[this.section.data.name] = this.section.prev;
};

Parser.prototype.transform = function (commentmap) {
  var file, blocks, i, l;

  commentmap = commentmap || this.commentmap;

  for (file in commentmap) {
    blocks = commentmap[file];

    // Process all comment blocks for the current file
    l = blocks.length;
    for (i = 0; i < l; i++) {
      this.processblock(blocks[i]);
    }

    // Generate the toc
    this.generatetoc(this.root);
  }
};

// Generate the toc
Parser.prototype.generatetoc = function (pointer) {

  var levels = [];
  var brackets = '';
  var i, l, node, level, name, sectionData, isMethod, indent;

  for (node in pointer) {
    levels.push(node);
  }

  // Sort alphabetically and format data
  levels = levels.sort();
  l = levels.length;
  for (i = 0; i < l; i++) {
    level = levels[i];

    this.lvl.push(level);

    name = this.lvl.join('.');
    sectionData = this.tocData[name];
    isMethod = sectionData.type && sectionData.type.indexOf('method') + 1;
    indent = this.lvl.length - 1;

    if (isMethod) {
      if (sectionData.params && sectionData.params.length) {
        if (sectionData.params.length === 1) {
          brackets = '(' + sectionData.params[0].join(', ') + ')';
        } else {
          brackets = '(\u2026)';
        }
      } else {
        brackets = '()';
      }
    }

    sectionData.brackets = brackets;

    // Prevent duplicates
    if (!this.utoc[name]) {
      this.sections.push(this.blockData[name]);
      this.toc.push({
        indent: indent,
        name: name,
        type: sectionData.type,
        brackets: isMethod ? '()' : ''
      });
      this.utoc[name] = 1;
    }

    this.generatetoc(pointer[level]);
    this.lvl.pop();
  }
};

module.exports = Parser;
