/*!
 * comment.js
 * Copyright (c) 2014 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/comment.js/blob/master/LICENSE.txt
 */

'use strict';

var utils = require('./utils');
var Parser = require('./parser');
var Scanner = require('./scanner');

var Commentjs = function (options) {

  var defaults = {
    verbose: false,
    source: [],
    extension: '.js',
    exclude: '.DS_Store,.svn,CVS,.git,build_rollup_tmp,build_tmp,node_modules',
    regex: null,
    version: '0.1.0',
    recurse: true
  };

  this.options = utils._.extend({}, defaults, options);

  // Init the file scanner
  this.scanner = new Scanner(this.options);

  this.filemap = {};
};

Commentjs.prototype.run = function () {
  this.starttime = Date.now();

  // Populate the filemap scanning the source
  this.filemap = this.scanner.scan(this.options.source);

  if (utils._.isEmpty(this.filemap)) {
    utils.log.warn('No files found for', JSON.stringify(this.options.source));
    return null;
  }

  var docs = new Parser({
    filemap: this.filemap
  });

  var data = docs.parse();

  this.endtime = Date.now();

  utils.log.ok(
    'Parsed', this.scanner.filecount, 'file' +
    (this.scanner.filecount > 1 ? 's' : '') +
    ' in', (this.endtime - this.starttime) + 'ms');

  return data;
};

module.exports = Commentjs;
