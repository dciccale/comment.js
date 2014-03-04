/**
 * At this point an object is generated but of course this was not meant to do that because it has
 * no comment structure, if the user writes many texts (*) or titles (>) or code examples or
 * whatever I have no way to render this on the template, since the amount of fields can change, and
 * can be in any order.
 *
 * One solution: Define a specific structure, with no actual strings in the comments, for instance
 * no > Usage title or > Parameters, this should be on the template and could be extracted by making
 * a specific structure the user must follow, for example
 * /*\
 * $.someMethod
 * [ method ]
 * - arg1 (string) desc
 * - arg2 (object) desc 2
 * = (string) desc for return object
 * | code
 * | code
 * \*\/
 *
 * Another solution: give each tag a template (could be customized) where to render itself and concat each rendered
 * template to the output.
 * So there will be no final template, but small templates for each kind of tag.
 * This may slow down the process, or may not if handlebar templates are pre-compiled.
 *
 * The second solution is much much flexible since you can write whatever you want in your comments,
 * many examples, paragraphs, titles, anything in any order.
 *
 * There may be another way of doing it
 */

var fs = require('fs');
var tags = require('./tags').precompile();
var utils = require('./utils');
var _ = require('lodash');

// var REGEX_DOCBLOCK = /\/\*\\[\s\S]*?\\\*\//gm;
var REGEX_START_COMMENT = /^\s*\/\*\\\s*$/;
var REGEX_END_COMMENT = /^\s*\\\*\/\s*$/;
var REGEX_ROW_DATA = /^\s*(\S)(?:(?!\n)\s(.*))?$/;
var REGEX_LINES = /\n/;

var root = {};
var root_namespace = {};
var lvl = [];
var TOC = [];
var utoc = {};
var lvl = [];
var chunks = {};
var pointer, namespace;

var DocParser = function (filename) {
  this.filename = filename;
  this.tags = tags;
};

DocParser.prototype.parse = function () {
  var filename = this.filename;

  var code = fs.readFileSync(filename, 'utf-8').toString();

  // normalize line breaks
  code = code.replace(/\r\n/gm, '\n');

  this.transform(this.extract(code, filename));
};

DocParser.prototype.extract = function (code, filename) {
  var commentlines, comment,
    lines = code.split(REGEX_LINES),
    len = lines.length, i, linenum;

  var commentmap = {};

  for (i = 0; i < len; i++) {
    line = lines[i];

    if (REGEX_START_COMMENT.test(line)) {
      commentlines = [];

      while (i < len && !REGEX_END_COMMENT.test(line)) {
        commentlines.push(line);
        i++;
        line = lines[i];
        linenum = i + 1;
      }

      // remove /*\
      commentlines.shift();

      comment = commentlines.join('\n');
      commentmap[filename] = commentmap[filename] || [];
      commentmap[filename].push(this.handlecomment(comment, filename, linenum));
    }
  }

  return commentmap;
};

DocParser.prototype.handlecomment = function (comment, filename, linenum) {
  return {
    comment: comment,
    line: linenum
  }
};

// TODO:
// if an object can be stored will be much better,
// to access the param names to form the title (param1, [param2]) this have to be reviewd..
DocParser.prototype.processblock = function (block, filename) {
  var block_lines = block.comment.split(REGEX_LINES);
  var firstline = false;
  var lastline = false;
  var target = {};
  var tagObj, prevObj, prevRet = {};
  var itemData = {};

  // Pushes the current extracted data into the pointer object.
  // the pointer object is made of each found namespace.
  // an array is pushed to each namespace inside another array hanging from a "data" property.
  // the array that is pushed contains the template and data to render [template, data]
  // since the order of the found comment data needs to be preserved
  var render = function (obj, data, mode) {
    // var data = {};
    // data[mode] = target[mode];

    pointer.data = pointer.data || [];

    if (obj.template && data) {
      // concat the rendered content for the current section
      itemData.section.content += obj.template(data);

      // TODO:
      // could also push something like this {template: template, data: data}
      pointer.data.push([obj.template, data]);

      delete prevRet[mode];
      // clear the tag data after render
      delete target[mode];
    }
  };

  block_lines.forEach(function (line, i) {
    var data = line.match(REGEX_ROW_DATA);
    var tag, value, title, ret;

    if (i === 0) {
      firstline = true;
      pointer = root;
      namespace = root_namespace;
    }

    if (i === (block_lines.length - 1)) {
      lastline = true;
    }

    if (data) {
      tag = data[1];
      value = data[2];

      if (tag === '*' && firstline) {
        firstline = false;

        var title = value.split('.');
        title.forEach(function (tit, i) {
          pointer = pointer[tit] = pointer[tit] || {};
          namespace = namespace[tit] = namespace[tit] || {};
        });

        value = {
          name: value,
          filename: filename,
          level: ++title.length,
          content: ''
        };

        tag = 'section';
        tagObj = tags[tag];
        target = tagObj.callback(tag, value, target, block, itemData);
        // itemData = value;
        itemData[tag] = target[tag];
        itemData.template = tagObj.template;
        itemData.name = value.name;

      } else {
        tagObj = tags[tag];
        ret = tagObj.callback(tag, value, target, block, itemData);

        // when the mode changes, render the previous
        shouldRender = (target.mode !== tagObj.name);

        if (prevObj && prevObj.single) {
          shouldRender = true;
        }

        // TODO: the render should be outside
        if (shouldRender) {
          if (prevObj) {
            render(prevObj, prevRet, target.mode);
          }
        }

        // lastline, render the current tag
        if (lastline) {
          render(tagObj, ret, tagObj.name);
        }

        // save current mode
        target.mode = tags[tag].name;

        // save the previous tag object for rendering when needed
        prevObj = tagObj;
        prevRet[target.mode] = ret[target.mode];
      }
    }
  });

  itemData.line = block.line;
  chunks[itemData.name] = itemData;

  return itemData.section.content;
};

DocParser.prototype.writeOutput = function (file, content) {
  var main_template = utils.file.read('templates/main.html');

  var template = utils.template.compile(main_template);

  var output = template({
    title: '$B.ui.dialog',
    content: content,
    toc: TOC
  });

  utils.file.write('docs/' + file + '.html', output);
};

DocParser.prototype.render = function (filedata) {
  function findNested (obj, key, memo) {
    if (!_.isArray(memo)) {
      memo = [];
    }
    _.forOwn(obj, function(val, i) {
      if (i === key) {
        memo.push(val);
      } else if (_.isPlainObject(val)) {
        findNested(val, key, memo);
      }
    });
    return memo;
  }

  var dataToRender = findNested(filedata, 'data');
  var _dataToRender = _.map(dataToRender, function (parts) {
    var str = '';

    _.each(parts, function (tag) {
      var template = tag[0];
      var data = tag[1];
      str += template(data);
    });

    return str;
  });

  return _dataToRender.join('');
};

DocParser.prototype.transform = function (commentmap) {
  var that = this;
  var file, blocks;
  var total = [];

  // var d = Date.now();

  for (file in commentmap) {
    blocks = commentmap[file];

    blocks.forEach(function (block) {
      var res = that.processblock(block, file);
      total.push(res);
    });

    this.runner(root_namespace);

    // var content = this.render(root);
    var content = html;
    this.writeOutput(file, content);
    // this.writeOutput(file, total);
  }

  // console.log(Date.now() -d);
};


var html = '';
// creates the toc
DocParser.prototype.runner = function (pointer) {

  var that = this;
  var level = [], node;

  for (node in pointer) {
    level.push(node);
  }

  // sort alphabetically and format data
  level.sort().forEach(function (_level) {
    lvl.push(_level);
    var name = lvl.join('.');
    var itemData = chunks[name];

    html += itemData.template(itemData)
    // html += chunks[name];
    // var isMethod = itemData.type && itemData.type.indexOf('method') + 1;
    // if (isMethod) {
    //   if (itemData.params) {
    //     if (itemData.params.length === 1) {
    //       chunk += '(' + itemData.params[0].join(', ') + ')';
    //     } else {
    //       chunk += '(\u2026)';
    //     }
    //   } else {
    //     chunk += '()';
    //   }
    // }

      var indent = 0;
      name.replace(/\./g, function () {
        indent++;
      });

      if (!utoc[name]) {
        TOC.push({
          indent: indent,
          name: name,
          // clas: itemData.clas || '',
          // brackets: isMethod ? '()' : ''
        });
        utoc[name] = 1;
      }

    that.runner(pointer[_level]);
    lvl.pop();
  });
};

var parser = new DocParser('bbva.ui.dialog.js').parse();
