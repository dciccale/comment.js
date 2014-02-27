
'use strict';

var utils = require('../utils');

module.exports['o'] = {
  name: 'json',
  template: 'json.html',
  callback: function (tag, value, target, block) {
    var desc = value.match(/^\s*([^\(\s]+)\s*\(([^\)]+)\)\s*(.*?)\s*$/),
      start = value.match(/\s*\{\s*$/),
      end = value.match(/\s*\}\s*,?\s*$/),
      types,
      optional,
      key,
      obj = {};

    target.json = target.json || [];

    if (desc) {
      desc.shift();
      key = desc.shift();

      obj.key = key;

      types = desc.shift().split(utils._.REGEX_TYPES);
      obj.types = types;

      desc = desc.shift().replace(utils._.REGEX_OPTIONAL_PARAM, function () {
        optional = true;
        return '';
      });

      if (optional) {
        obj.optional = true;
      }

      obj.desc = utils._.format(desc);
      target.json.push(obj);
    }

    return target;
  }
};
