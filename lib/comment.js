/*!
 * comment.js
 * Copyright (c) 2014 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/comment.js/blob/master/LICENSE.txt
 */

'use strict';

var path = require('path');
var utils = require('./utils');
var Parser = require('./parser');
var Scanner = require('./scanner');
var View = require('./view');

var Commentjs = function (options) {

  var defaults = {
    verbose: false,
    output: path.join(process.cwd(), 'docs'),
    source: [],
    extension: '.js',
    exclude: '.DS_Store,.svn,CVS,.git,build_rollup_tmp,build_tmp,node_modules',
    regex: null,
    version: '0.1.0',
    recurse: true
  };

  this.options = utils._.extend({}, defaults, options);

  // Init the file scanner
  this.scanner = new Scanner({
    extension: this.options.extension,
    exclude: this.options.exclude,
    source: this.options.source,
    recurse: this.options.recurse
  });

  this.filemap = {};
};

Commentjs.prototype.run = function () {
  this.starttime = Date.now();

  this.filemap = this.scanner.scan(this.options.source);

  var docs = new Parser({
    filemap: this.filemap
  });

  var data = docs.parse();

  this.endtime = Date.now();

  utils.log.ok('Parsed', this.scanner.filecount, 'files in', (this.endtime - this.starttime) + 'ms');

  return data;
};

module.exports = Commentjs;

var cc = new Commentjs({source: ['bbva.ui.dialog.js']});
var data = cc.run();
var view = new View({
  filemap: cc.filemap,
  output: cc.options.output,
  data: data
});
view.render(function () {
  utils.log.ok('Rendered!');
});
