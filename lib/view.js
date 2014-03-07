/*!
 * comment.js
 * Copyright (c) 2014 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/comment.js/blob/master/LICENSE.txt
 */

'use strict';

var path = require('path');
var utils = require('./utils');
var rimraf = require('rimraf');
var Template = require('./template');

var View = function (options) {

  var defaults = {
    filemap: {},
    data: {},
    output: path.join(process.cwd(), 'docs'),
    themesdir: path.join(__dirname, '..', 'themes', 'default'),
    title: 'API Documentation',
    prettify: false
  };

  this.options = utils._.extend({}, defaults, options);

  this.data = this.options.data;
  this.data.title = this.data.title || this.options.title;

  if (this.data.scripts && Array.isArray(this.data.scripts)) {
    this.data.scripts = this.data.scripts.map(function (scriptPath) {
      return path.relative(this.options.output, scriptPath);
    }, this);
  }

  // Get and pre-compile templates
  this.templates = new Template({
    path: this.options.themesdir,
    prettify: this.options.prettify
  });
};

// Render the templates and write to disk
View.prototype.render = function (callback) {
  var html;

  // Create output dir and copy theme assets
  this.copyassets();

  // Render the main template
  html = this.templates.main(this.data);

  // Write the content to the doc file
  this.writedoc(this.data.docsname, html);

  // Should render pretty src code?
  if (this.options.prettify) {
    this.prettify(this.options.filemap);
  }

  // Execute optional callback after render
  if (callback) {
    callback();
  }
};

// Returns the full output path for the filename
View.prototype._getPath = function (filename) {
  filename = path.basename(filename, path.extname(filename));
  return path.join(this.options.output, filename);
};

View.prototype.writedoc = function (filename, content) {
  var outputfile = this._getPath(filename) + '.html';
  utils.file.write(outputfile, content);
  utils.log.ok('Saved to', path.relative(process.cwd(), outputfile));
};

// Prettify the source code and save it to its own html file
View.prototype.prettify = function (filemap) {
  var filename, content, outputfile, data, src;

  filemap = filemap || this.options.filemap;

  for (filename in filemap) {
    data = {};

    // Normalize line endings
    content = filemap[filename].replace(/\r\n?/gm, '\n');

    data.src = content;
    data.filename = path.basename(filename);

    outputfile = this._getPath(filename) + '-src.html';

    // Render src template
    src = this.templates.src(data);

    // Write the prettyfied source
    utils.file.write(outputfile, src);
    utils.log.ok('Generated source saved to', path.relative(process.cwd(), outputfile));
  }
};

View.prototype.copyassets = function () {

  rimraf.sync(this.options.output);

  utils.file.mkdir(this.options.output);

  ['css', 'js', 'img'].forEach(function (dir) {
    var destpath = path.join(this.options.output, dir);
    var assetpath = path.join(this.options.themesdir, dir, '*.*');
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
