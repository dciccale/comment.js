/*!
 * comment.js
 * Copyright (c) 2012 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/comment.js/blob/master/LICENSE.txt
 */

'use strict';

var template = module.exports = {};

var utils = require('../utils');
var handlebars = require('handlebars');

template.compile = function (tmpl) {
  try {
    var template = handlebars.compile(tmpl);
    return template;
  } catch (e) {
    utils.log.warn('Unable to process the template (' + e.message + ').');
  }
};
