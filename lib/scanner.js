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
  this.filecount = 0;
  this.filemap = {};

  var defaults = {
    exclude: '.DS_Store,.svn,CVS,.git,build_rollup_tmp,build_tmp,node_modules'
  };

  this.options = utils._.extend({}, defaults, options);

  this.options.extensions = this.options.extension.split(',');
  this.options.excludes = utils._.hash(this.options.exclude.split(','));

  // Always add default excludes
  if (this.options.exclude !== defaults.exclude) {
    defaults.exclude.split(',').forEach(function (item) {
      this.options.excludes[item] = true;
    }, this);
  }
};

Scanner.prototype.scan = function (source) {
  source = source || this.options.source || [];

  // Ensure an array
  if (!Array.isArray(source)) {
    source = [source];
  }

  // Always recurse at least one level deep
  source.forEach(this.parsefile(process.cwd(), true), this);

  return this.filemap;
};

Scanner.prototype.parsedir = function (dir) {
  console.log('parsedir', dir);
  if (!utils.file.isDir(dir)) {
    utils.log.error('Can not find directory: ' + dir);
    process.exit(1);
  }

  fs.readdirSync(dir).sort().forEach(this.parsefile(dir, this.options.recurse), this);

  return this.filemap;
};

Scanner.prototype.parsefile = function (dir, recurse) {
  return function (filename) {
    var filepath = path.normalize(path.resolve(dir, filename));

    // Exclude dot files and others
    if (this.isExcluded(filename)) {
      return;
    }

    if (utils.file.isDir(filepath) && recurse) {
      this.parsedir(filepath);
    } else if (utils.file.isFile(filepath) && this.hasValidExtension(filepath)) {
      this.filecount++;
      this.filemap[filepath] = utils.file.read(filepath);
    }
  };
};

Scanner.prototype.hasValidExtension = function (filename) {
  return utils._.in(this.options.extensions, path.extname(filename));
};

Scanner.prototype.isExcluded = function (filename) {
  filename = path.normalize(filename);
  return filename.match(/^\.[^\.\/\\]/) || utils._.in(this.options.excludes, filename);
};

module.exports = Scanner;
