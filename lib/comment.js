/*!
 * comment.js 0.0.1 - API Documentation builder
 * Copyright (c) 2012 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/comment.js/blob/master/LICENSE.txt
 */
'use strict';

var fs = require('fs'),
  path = require('path'),
  parsy = require('parsy'),
  utils = require('./utils'),
  docit = require('./doc.js'),
  handlebars = require('handlebars'),

  // windows support
  isWindows = /win32/.test(process.platform),

  // template files
  templateDir = 'template',
  templateFile = 'template.html',

  // path to assets
  cssDir = 'css',
  jsDir = 'js',
  imgDir = 'img',

  // where generated source files goes
  srcFolder = 'src',
  outputDir = 'docs';

// normalized __dirname path (may have quotes on windows)
function getRootPath(file) {
  var dirname = path.normalize(__dirname);
  var dirpath = path.resolve(dirname, templateDir, file);
  return (isWindows) ? '\'' + dirpath + '\'' : dirpath;
}

function commentjs(files, options) {
  var sourceLinks = [],
    chunks = {},
    title = '',
    outputFile,
    outputPath = options.output || outputDir,
    scripts = [],
    toc = [],
    // the current directory
    sourceDir = process.cwd() + path.sep,
    filesSource = [],
    options,
    fileRegex,
    configFileName,
    json,
    indexOfConfigFile,
    trackingID = null;

  // no files, exit
  if (!files.length || /''/.test(files[0]) || !files[0]) {
    console.log('Usage: ' + (module.parent ? 'commentjs ' : 'node comment.js ') + '<file1.js file2.js or a .json file>');
    process.exit(1);
  }

  // if a directory is passed, expand files to all .js inside
  if (files.length === 1 && !path.extname(files[0])) {
    if (utils.file.isDir(files[0])) {
      files = utils.file.expand(files[0] + '*.js');
    }
  }

  if (path.extname(outputPath) === '.html') {
    outputFile = path.basename(outputPath);
  }

  function changeFileExt(file, ext) {
    return path.basename(file, path.extname(file)) + ext;
  }

  function getOutputPath() {
    // strip extension from path if any
    if (path.extname(outputPath)) {
      outputPath = path.dirname(outputPath);
    }
    // get absolute path
    outputPath = path.resolve(outputPath) + path.sep;
    return outputPath;
  }

  function getOutputFile() {
    // if no output, set default output filename
    // to be the same as the first filename
    if (!outputFile) {
      outputFile = files[0];
    }
    // normalize output file extension to be .html
    if (path.extname(outputFile) !== '.html') {
      outputFile = changeFileExt(outputFile, '.html');
    }
    outputFile = outputPath + outputFile;
    return outputFile;
  }

  // generate src file name
  function createSrcFileName(file) {
    return path.resolve(outputPath, srcFolder, changeFileExt(file, '-src.html'));
  }

  function dirExists(dir) {
    return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
  }

  function pushFiles(file) {
    // set full file path
    var filePath = sourceDir + (file.path || file),
      // get only filename
      filename = path.basename(file);

    // normalize file path
    file = path.normalize(filePath);

    if ((!fileRegex || fileRegex.test(filename)) && !utils.file.isDir(file)) {
      files.push(file);
      if (file.link && typeof file.link === 'string') {
        sourceLinks.push(file.link);
      }
    }
  }

  function getResourcePath(dir) {
    return getRootPath(dir + path.sep + '*.*');
  }

  // check for json config file
  if (files.length === 1 && path.extname(files[0]) === '.json') {
    configFileName = files[0];
    // parse json file
    json = JSON.parse(utils.file.read(files[0]));
    // get docs title
    title = json.title;
    // empty array
    files.shift();
    // user options
    options = json.options;
    filesSource = [];

    // source is required
    if (!options || !options.source || !options.source.length) {
      console.log('Specify a source on your json config file');
      process.exit(1);
    }

    if (options.regex) {
      fileRegex = new RegExp(options.regex);
    }

    // check if source is a directory
    if (typeof options.source === 'string' && utils.file.isDir(options.source)) {
      // set correct source directory to look for files
      // sourceDir += path.basename(options.source) + path.sep;
      sourceDir = path.normalize(options.source + path.sep);
      // get all files in directory
      filesSource = utils.file.expand(sourceDir + '*.js');
      sourceDir = '';

    // is an array
    } else if (Array.isArray(options.source)) {
      filesSource = options.source;

    // is one file, push to stack
    } else if (typeof options.source === 'string') {
      filesSource.push(options.source);
    }

    // remove config file from list if exists
    indexOfConfigFile = filesSource.indexOf(configFileName);
    if (indexOfConfigFile !== -1) {
      filesSource.splice(indexOfConfigFile, 1);
    }

    // create array of files to be parsed
    filesSource.forEach(pushFiles);

    // get output dir
    outputFile = options.output;
    outputPath = options.output || outputPath;

    // TODO: extend a global templateData object
    // any scripts to include in doc file? (e.g for code demos)
    scripts = options.scripts || scripts;
    // google analytics tracking code
    trackingID = options.trackingID || trackingID;
  }

  // no files to parse, exit
  if (!files.length) {
    console.log('comment.js ended without parsing any file');
    process.exit(1);
  }

  // normalize output
  outputPath = getOutputPath();
  outputFile = getOutputFile();

  // processing function
  function generateDocs() {
    console.log('\nGenerating output...');

    var content = '',
      html,
      template,
      // TODO: extend a global templateData object
      data;

    files.forEach(function (file, i) {
      console.log('Processing ' + file);

      // read file and normalize EOL
      var code = utils.file.read(file).replace(/\r\n|\r/g, '\n'),
        relativeSourceFileName = createSrcFileName(file),
        // link to source file
        sourceFileName = sourceLinks[i] || createSrcFileName(file),
        // parse file content
        res = docit(code, file, relativeSourceFileName),
        key;


      if (res.sections && res.source) {
        toc = toc.concat(res.toc);

        for (key in res.chunks) {
          if (res.chunks.hasOwnProperty(key)) {
            chunks[key] = res.chunks[key];
          }
        }

        title = title || res.title;

        console.log('Found \u001b[32m' + res.sections + '\u001b[0m sections.');
        console.log('Processing \u001b[32m' + res.loc + '\u001b[0m lines of code...');

        // if no source link create local src file
        if (!sourceLinks[i]) {
          // create src file
          utils.file.write(sourceFileName, res.source);
        }

      // no comment-js format? warn but continue to next file
      } else {
        console.log('\u001b[31mNo comment-js format found in\u001b[0m ' + file);
      }
    });

    // ensure no toc.name duplication
    toc.forEach(function (currentToc, i) {
      if (!i || currentToc.name !== toc[i - 1].name) {
        content += chunks[currentToc.name] || '';
      }
    });

    // in case I want to add the object type as a class in the nav links
    // {{#if clas}} class='{{clas}}'{{/if}}

    // get base template
    html = utils.file.read(getRootPath(templateFile));
    template = handlebars.compile(html);
    data = {
      title: title,
      toc: toc,
      content: content,
      scripts: scripts,
      trackingID: trackingID
    };

    // render
    html = template(data);

    // write output
    utils.file.write(outputFile, html);
    console.log('\n\nFinished!\n---------\nOutput: \u001b[32m' + outputFile + '\u001b[0m');
  }

  // create output directories
  utils.file.mkdir(outputPath + (!sourceLinks.length ? srcFolder : ''));
  generateDocs();

  // copy template files
  [cssDir, jsDir, imgDir].forEach(function (folder) {
    var outputDir = outputPath + folder;
    var files = utils.file.expand(getResourcePath(folder));
    if (!dirExists(outputDir)) {
      utils.file.mkdir(outputDir);
    }
    files.forEach(function (srcpath) {
      utils.file.copy(srcpath, outputDir);
    });
  });
}

module.exports = commentjs;
