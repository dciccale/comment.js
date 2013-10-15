// utils

'use strict';


var utils = module.exports = {};

function requireUtil(name) {
  return utils[name] = require('./util/' + name);
}

requireUtil('file');
requireUtil('prettify');

// expose specific method
function expose(obj, methodName) {
  utils[methodName] = obj[methodName].bind(obj);
}

expose(utils.prettify, 'prettify');
