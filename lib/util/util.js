'use strict';

var _ = module.exports = {};

var slice = Array.prototype.slice;

_.extend = function(obj) {
  var objs = slice.call(arguments, 1);
  objs.forEach(function(source) {
    if (source) {
      for (var prop in source) {
        obj[prop] = source[prop];
      }
    }
  });
  return obj;
};
