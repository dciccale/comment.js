/*!
 * comment.js
 * Copyright (c) 2014 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/comment.js/blob/master/LICENSE.txt
 */

'use strict';

var fs = require('fs');
var path = require('path');
var utils = require('./utils');
var dot = require('dot');
var rimraf = require('rimraf');

var REGEX_DOT_PARTIAL_EXT = /\.def(\.dot|\.jst)?$/;

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
  this.data.title = this.data.title || defaults.title;

  // pre-compile templates
  this.templates = this._precompile();
};

// Returns the content of a template
View.prototype._getTemplate = function (name) {
  return utils.file.read(path.join(this.options.themesdir, name));
};

// Reads partial templates and map them into an object to be passed to the main template
View.prototype._getPartials = function () {
  var partialsdir = path.join(this.options.themesdir, 'partials');
  var partials = {};

  fs.readdirSync(partialsdir).forEach(function (filename) {
    var filepath = path.join(partialsdir, filename);
    var name;

    if (REGEX_DOT_PARTIAL_EXT.test(filename)) {
      name = filename.replace(REGEX_DOT_PARTIAL_EXT, '');
      partials[name] = utils.file.read(filepath);
    }
  }, this);

  return partials;
};

// Pre-compile templates
View.prototype._precompile = function () {
  var templates = {};
  var defs = this._getPartials();

  // Pre-compile the main template along with the partials
  templates.main = dot.compile(this._getTemplate('main.dot'), defs);

  // Get and pre-compile the src template if needed
  if (this.options.prettify) {
    templates.src = dot.template(this._getTemplate('src.dot'));
  }

  return templates;
};

// Render the templates and write to disk
View.prototype.render = function (callback) {
  // dot.templateSettings.strip = false;

  // Render the main template
  var html = this.templates.main(this.data);

  // Create output dir and copy theme assets
  this.copyassets();

  // Write the actual doc file
  this.write(this.data.docsname, html);

  // Render src code?
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

View.prototype.write = function (filename, content) {
  var outputfile = this._getPath(filename) + '.html';
  utils.file.write(outputfile, content);
  utils.log.ok('Saved to', path.relative(process.cwd(), outputfile));
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
