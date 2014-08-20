/*!
 * comment.js
 * Copyright (c) 2014 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/comment.js/blob/master/LICENSE.txt
 */

'use strict';

var utils = require('../utils');

var Tag = function (name, definition) {
  this.name = name;

  utils._.forEach(Object.keys(definition), function (key) {
    this[key] = definition[key];
  }, this);
};

var _tags = {};
var _symbols = {};
var tags = {
  define: function (name, definition) {
    var tag = new Tag(name, definition);
    _tags[tag.symbol] = tag;
    _symbols[name] = tag.symbol;
    return tag;
  },

  // Get tag symbol if the tag name is passed or viceversa
  get: function (q) {
    return utils._.in(_tags, q) ? _tags[q] : utils._.in(_symbols, q) ? _symbols[q] : null;
  }
};

require('./definitions').defineTags(tags);

module.exports = tags;
