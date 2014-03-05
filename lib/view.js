/*!
 * comment.js
 * Copyright (c) 2014 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/comment.js/blob/master/LICENSE.txt
 */

'use strict';

var path = require('path');
var utils = require('./utils');
var dot = require('dot');
var dots = dot.process({path: '../themes/default/templates'});
var CodeMirror = require('codemirror-highlight');
var REGEX_LINES = /\n/;

var View = function (options) {
  this.options = options;
  this.__dirname = path.normalize(__dirname);
};

var changeExt = function (file, ext) {
  return path.basename(file, path.extname(file)) + ext;
};

View.prototype.render = function (callback) {
  // dot.templateSettings.strip = false;

  var data = utils._.extend({
    title: '$B.ui.dialog'
  }, this.options.data);

  var html = dots.main(data);

  var filename = this.options.data.sections[0][0].filename;
  this.write(filename, html);

  // Render src code?
  this.prettify(this.options.filemap);

  callback();
};

View.prototype.prettify = function (filemap) {
  var filename, content, outputfile, data, src, lines;

  filemap = filemap || this.options.filemap;

  for (filename in filemap) {
    data = {};

    // Normalize line endings
    content = filemap[filename].replace(/\r\n/gm, '\n');
    lines = content.split(REGEX_LINES);

    CodeMirror.loadMode('javascript');
    data.src = CodeMirror.highlight(content, {mode: 'javascript'});
    data.ls = lines.length;

    outputfile = path.join(this.options.output, changeExt(filename, '-src.html'));
    src = dots.src(data);
    utils.file.write(outputfile, src);
  }
};

View.prototype.write = function (filename, content) {
  var outputfile = path.join(this.options.output, changeExt(filename, '.html'));
  this.copyassets();
  utils.file.write(outputfile, content);
  utils.log.ok('Saved to', outputfile);
};

View.prototype.copyassets = function () {
  utils.file.mkdir(this.options.output);

  ['css', 'js', 'img'].forEach(function (dir) {
    var destpath = path.join(this.options.output, dir);
    var assetpath = path.resolve(this.__dirname, '../themes/default', path.join(dir, '*.*'));
    var assets = utils.file.expand(assetpath);

    if (!utils.file.exists(destpath)) {
      utils.file.mkdir(destpath);
    }

    assets.forEach(function (srcpath) {
      utils.file.copy(srcpath, destpath);
    });
  }, this);

};

module.exports = View;
