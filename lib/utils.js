/*!
 * comment.js
 * Copyright (c) 2012 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/comment.js/blob/master/LICENSE.txt
 */

'use strict';

var utils = module.exports = {};

function requireUtil(name, exportName) {
  return utils[exportName || name] = require('./util/' + name);
}

requireUtil('util', '_');
requireUtil('log');
requireUtil('file');
