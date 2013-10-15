'use strict';

var log = module.exports = {};

var colors = require('colors');

log.write = function (msg) {
  process.stdout.write(msg + '\n');
}

log.ok = function (msg) {
  log.write((msg).green);
}

log.warn = function (msg) {
  log.write((msg).yellow);
}

log.error = function (msg) {
  log.write((msg).red);
}

log.debug = function (msg) {
  log.write(msg);
}
