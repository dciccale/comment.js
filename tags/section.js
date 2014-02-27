
'use strict';

module.exports['section'] = {
  name: 'section',
  template: 'section.html',
  callback: function (tag, value, target, block) {
    target.section = {
      name: value.name,
      title: value.name.replace(/\./g, '-'),
      linenum: value.linenum,
      filename: value.filename
    };

    return target;
  }
};
