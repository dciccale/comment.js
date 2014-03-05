/*!
 * comment.js
 * Copyright (c) 2014 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/comment.js/blob/master/LICENSE.txt
 */

'use strict';

var utils = require('../utils');

var REGEX_OPTIONAL_PARAM = /#optional\s*/g;
var REGEX_TYPES = /\s*\|\s*/;

exports.defineTags = function (tags) {
  // Describes the object type
  // and in the case of a property member its type/s can be specified
  // [ method ] or [ property (string, number) ]
  tags.define('type', {
    symbol: '[',
    process: function (value, section) {
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

      section.data.type = value;
      // section.current.push({
      //   type: type
      // });
    }
  });

  tags.define('head', {
    symbol: '>',
    process: function (value, section) {
      section.current.push({
        head: utils._.format(value)
      });
    }
  });

  tags.define('text', {
    symbol: '*',
    single: true,
    process: function (value, section) {
      section.current.push({
        text: utils._.format(value)
      });
    }
  });

  tags.define('section', {
    symbol: 'section',
    process: function (value, section) {
      section.current.push({
        section: value
      });

      // var title = value.name.replace(/\./g, '-');
    }
  });

  tags.define('params', {
    symbol: '-',
    process: function (value, section) {
      var optional, desc, types;
      var param = {};
      var arr, sectionData;

      section.data.params = section.data.params || [];

      if (section.mode !== this.name) {
        arr = [];
        section.data.params.push([]);
        section.current.push({params: arr});
        section.current = arr;
      }

      sectionData = section.data.params[section.data.params.length - 1];

      value = value.replace(REGEX_OPTIONAL_PARAM, function () {
        optional = true;
        return '';
      });

      desc = value.split(/(\s*[\(\)]\s*)/);

      param.name = desc[0];

      // Push to section data
      sectionData.push((optional ? '[' : '') + param.name + (optional ? ']' : ''));

      desc.shift();
      desc.shift();

      if (optional) {
        param.optional = true;
      }

      types = desc.shift().split(REGEX_TYPES);

      desc.shift();

      param.types = types;
      param.desc = (utils._.format(desc.join('')) || '&#160;');

      section.current.push(param);
    }
  });

  tags.define('json', {
    symbol: 'o',
    process: function (value, section) {
      var desc = value.match(/^\s*([^\(\s]+)\s*\(([^\)]+)\)\s*(.*?)\s*$/);
      // var start = value.match(/\s*\{\s*$/);
      // var end = value.match(/\s*\}\s*,?\s*$/);
      var param = {};
      var types, optional, key, arr;

      if (section.mode !== this.name) {
        arr = [];
        section.current.push({json: arr});
        section.current = arr;
      }

      if (desc) {
        desc.shift();

        key = desc.shift();

        param.key = key;

        types = desc.shift().split(REGEX_TYPES);
        param.types = types;

        desc = desc.shift().replace(REGEX_OPTIONAL_PARAM, function () {
          optional = true;
          return '';
        });

        if (optional) {
          param.optional = true;
        }

        param.desc = utils._.format(desc);

        section.current.push(param);
      }
    }
  });

  tags.define('html', {
    symbol: '#',
    process: function (value, section) {
      section.current.push({
        html: value + '\n'
      });
    }
  });

  tags.define('return', {
    symbol: '=',
    process: function (value, section) {
      var desc = value.split(/(\s*[\(\)]\s*)/);
      var types;

      desc.shift();
      desc.shift();

      types = desc.shift().split(REGEX_TYPES);
      desc.shift();

      section.current.push({
        return: {
          types: types,
          desc: utils._.format(desc.join(''))
        }
      });
    }
  });

  tags.define('code', {
    symbol: '|',
    process: function (value, section) {
      var arr;

      if (section.mode !== this.name) {
        arr = [];
        section.current.push({code: arr});
        section.current = arr;
      }

      section.current.push(value);
    }
  });
};
