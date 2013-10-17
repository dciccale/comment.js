/*!
 * comment.js
 * Copyright (c) 2012 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/comment.js/blob/master/LICENSE.txt
 */

'use strict';

// much of this module was taken from grunt.log but simplified
var log = module.exports = {};
var util = require('util');

var colors = require('colors');

function format(args) {
  // Args is a argument array so copy it in order to avoid wonky behavior.
  args = [].slice.call(args, 0);
  if (args.length > 0) {
    args[0] = String(args[0]);
  }
  return util.format.apply(util, args);
}

function write(msg) {
  msg = msg || '';
  process.stdout.write(msg);
}

function writeln(msg) {
  // Write blank line if no msg is passed in.
  msg = msg || '';
  write(msg + '\n');
}

log.write = function () {
  write(format(arguments));
  return log;
}

log.writeln = function () {
  writeln(format(arguments));
  return log;
};

log.ok = function () {
  var msg = format(arguments);
  if (arguments.length > 0) {
    writeln('>> '.green + msg.trim().replace(/\n/g, '\n>> '.green));
  } else {
    writeln('OK'.green);
  }
  return log;
}

log.warn = function () {
  var msg = format(arguments);
  if (arguments.length > 0) {
    writeln('>> '.yellow + msg.trim().replace(/\n/g, '\n>> '.yellow));
  } else {
    writeln('WARNING'.yellow);
  }
  return log;
}

log.error = function () {
  var msg = format(arguments);
  if (arguments.length > 0) {
    writeln('>> '.red + msg.trim().replace(/\n/g, '\n>> '.red));
  } else {
    writeln('ERROR'.red);
  }
  return log;
}

log.debug = function () {
  var msg = format(arguments);
  writeln(msg.magenta);
  return log;
}
