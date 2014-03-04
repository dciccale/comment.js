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
var dots = dot.process({path: "./templates"});

var View = function (options) {
  this.options = options;
  this.__dirname = path.normalize(__dirname);
};

View.prototype.render = function (callback) {
  // dot.templateSettings.strip = false;

  var data = utils._.extend({
    title: '$B.ui.dialog'
  }, this.options.data);

  var html = dots.template(data);

  this.write(html);

  var outputfile = path.join(this.options.output, 'index-src.html');
  var src = dots.templatesrc(data);
  utils.file.write(outputfile, src);

  callback();
};

View.prototype.write = function (content) {
  var outputfile = path.join(this.options.output, 'index.html');
  utils.file.write(outputfile, content);
  utils.log.ok('Saved to', outputfile);
};

View.prototype.copyassets = function () {
  utils.file.mkdir(this.options.output);

  ['css', 'js', 'img'].forEach(function (dir) {
    var destpath = path.join(this.options.output, dir);
    var assetpath = path.resolve(this.__dirname, 'template', path.join(dir, '*.*'));
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
