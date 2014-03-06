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
    current: this.sections,
    prev: this.sections,
    mode: ''
  };
  this.commentmap = {};
  this.toc = [];
  this.utoc = {};
  this.tocData = {};
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

    // The docs name uses the first file (to improve)
    docsname = docsname || filename;

    // Normalize line endings
    content = filemap[filename].replace(/\r\n?/gm, '\n');

    lines = content.split(REGEX_LINES);
    l = lines.length;

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
        this.commentmap[filename].push({comment: comment, line: linenum});
      }
    }
  }

  this.docsname = path.basename(docsname);

  return this.commentmap;
};

// Process a full comment block, line by line
Parser.prototype.processblock = function (block, filename) {
  var blocklines = block.comment.split(REGEX_LINES);
  var firstline = false;

  blocklines.forEach(function (line, i) {
    var data = line.match(REGEX_ROW_DATA);
    var symbol, value, tag, title;

    if (i === 0) {
      firstline = true;
      this.pointer = this.root;
    }

    if (data) {
      symbol = data[1];
      value = data[2];

      if (symbol === '*' && firstline) {
        firstline = false;

        // Get namespaces
        title = value.split('.');
        title.forEach(function (title) {
          this.pointer = this.pointer[title] = this.pointer[title] || {};
        }, this);

        this.section.data = {
          name: value,
          title: value.replace(/\./g, '-'),
          line: block.line,
          filename: path.basename(filename),
          srclink: path.basename(filename, path.extname(filename)),
          level: ++title.length,
        };

        this.sections.push(this.section.current = this.section.prev = [this.section.data]);

      } else {
        tag = tags.get(symbol);

        if (this.section.mode !== tag.name) {
          this.section.current = this.section.prev;
        }

        // Process the value
        tag.process(value, this.section);

        this.section.mode = tag.name;
      }
    }
  }, this);

  // Save the section data for generating the toc later
  this.tocData[this.section.data.name] = this.section.data;
};

Parser.prototype.transform = function (commentmap) {
  var file, blocks;

  commentmap = commentmap || this.commentmap;

  for (file in commentmap) {
    blocks = commentmap[file];

    /* jshint -W083 */
    // Process all comment blocks for the current file
    blocks.forEach(function (block) {
      this.processblock(block, file);
    }, this);
    /* jshint +W083 */

    // Generate its toc
    this.generatetoc(this.root);
  }
};

// Generate the toc
Parser.prototype.generatetoc = function (pointer) {

  var levels = [], node;

  for (node in pointer) {
    levels.push(node);
  }

  // Sort alphabetically and format data
  levels.sort().forEach(function (level) {
    this.lvl.push(level);
    var name = this.lvl.join('.');
    var sectionData = this.tocData[name];
    var isMethod = sectionData.type && sectionData.type.indexOf('method') + 1;
    var indent = this.lvl.length - 1;
    var brackets = '';

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

    if (!this.utoc[name]) {
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
  }, this);
};

module.exports = Parser;
