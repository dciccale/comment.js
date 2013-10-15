// utils

'use strict';


var utils = module.exports = {};

function requireUtil(name, exportName) {
  return utils[exportName || name] = require('./util/' + name);
}

requireUtil('util', '_');
requireUtil('log');
requireUtil('file');
requireUtil('template');
requireUtil('prettify');

// expose specific method
function expose(obj, methodName) {
  utils[methodName] = obj[methodName].bind(obj);
}

expose(utils.prettify, 'prettify');
