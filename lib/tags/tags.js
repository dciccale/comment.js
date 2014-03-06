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

  Object.keys(definition).forEach(function (key) {
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

  get: function (q) {
    return utils._.in(_tags, q) ? _tags[q] : utils._.in(_symbols, q) ? _symbols[q] : null;
  },

  getByName: function (name) {

  }
};

require('./definitions').defineTags(tags);

module.exports = tags;
