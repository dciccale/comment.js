
'use strict';

var utils = require('../utils');

module.exports['>'] = {
  name: 'head',
  template: 'header.html',
  callback: function (tag, value, target, block) {
    target.head = utils._.format(value);

    return target;
  }
};
