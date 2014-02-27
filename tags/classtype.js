
'use strict';

var utils = require('../utils');

// Describes the object type
// and in the case of a property member its type/s can be specified
// [ method ] or [ property (string, number) ]
module.exports['['] = {
  name: 'type',
  callback: function (tag, value, target, block) {
    var type = {};
    var types;

    value = utils._.format(value).replace(/\(([^\)]+)\)/, function (all, t) {
      types = t;
      return '';
    });

    if (types) {
      types = types.split(',');
      type.types = types;
    }

    value = value.replace(/\s*\]\s*$/, '');

    type.name = value;

    target.type = type;

    return target;
  }
};
