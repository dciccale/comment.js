/*!
 * comment.js
 * Copyright (c) 2014 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/comment.js/blob/master/LICENSE.txt
 */

'use strict';

var path = require('path');
var fs = require('fs');

var utils = require('./utils');

var Scanner = function (options) {
  var defaults = {
    exclude: '.DS_Store,.svn,CVS,.git,build_rollup_tmp,build_tmp,node_modules',
    extension: '',
    regex: null
  };

  this.options = utils._.extend({}, defaults, options);

  this.options.extensions = this.options.extension.split(',');
  this.options.excludes = utils._.hash(this.options.exclude.split(','));

  // Always add default excludes
  if (this.options.exclude !== defaults.exclude) {
    utils._.forEach(defaults.exclude.split(','), function (item) {
      this.options.excludes[item] = true;
    }, this);
  }

  if (this.options.regex) {
    this.options.regex = new RegExp(this.options.regex);
  }

  this.filecount = 0;
  this.filemap = {};
};

Scanner.prototype.scan = function (source) {
  source = source || this.options.source || [];

  // Ensure an array
  if (!Array.isArray(source)) {
    source = [source];
  }

  // Always recurse at least one level deep
  utils._.forEach(source, this.parsepath(process.cwd(), true), this);

  return this.filemap;
};

Scanner.prototype.parsedir = function (dir) {
  if (!utils.file.isDir(dir)) {
    utils.log.error('Can not find directory: ' + dir);
    return;
  }

  utils._.forEach(fs.readdirSync(dir).sort(), this.parsepath(dir, this.options.recurse), this);

  return this.filemap;
};

Scanner.prototype.parsefilepath = function (dir, filename) {
  return function (filepath) {
    filepath = path.normalize(path.resolve(dir, filepath));

    // Exclude dot files and others
    if (this.isExcluded(filename)) {
      return;
    }

    if (utils.file.isDir(filepath) && recurse) {
      this.parsedir(filepath);
    } else if (utils.file.isFile(filepath) && this.isValidExt(filepath) && this.matchesRegex(filepath)) {
      this.filecount++;
      this.filemap[filepath] = utils.file.read(filepath);
    }
  };
};

Scanner.prototype.parsepath = function (dir, recurse) {
  return function (filename) {
    var files = utils.file.expand(filename);
    var filepath = path.normalize(path.resolve(dir, filename));
    if (files && files.length) {
      files.forEach(this.parsefilepath(dir, filename), this);
    } else {
      utils.log.warn('The path', filepath, 'doesn\'t exists');
    }
  };
};

Scanner.prototype.isValidExt = function (filepath) {
  var isValid = true;
  if (this.options.extension && !utils._.in(this.options.extensions, path.extname(filepath))) {
    isValid = false;
  }
  return isValid;
};

Scanner.prototype.matchesRegex = function (filepath) {
  var matches = true;
  if (this.options.regex && !this.options.regex.test(path.basename(filepath)))  {
    matches = false;
  }
  return matches;
};

Scanner.prototype.isExcluded = function (filename) {
  filename = path.normalize(filename);
  return filename.match(/^\.[^\.\/\\]/) || utils._.in(this.options.excludes, filename);
};

module.exports = Scanner;
