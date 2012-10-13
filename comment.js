/*!
 * comment.js 0.0.1 - API Documentation builder
 * Copyright (c) 2012 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/comment.js/blob/master/LICENSE.txt
 */

var fs = require("fs"),
  path = require("path"),
  docit = require("./doc.js"),
  exec = require("child_process").exec,

  // windows support..
  isWindows = /win/.test(process.platform),
  mkdir = isWindows ? "mkdir " : "mkdir -p ",
  cp = isWindows ? "copy " : "cp ",

  // template files
  templateSrc = 'src' + path.sep,
  templateFile = 'template.html',
  outputFilesDir = 'outputfiles' + path.sep,

  // assets directories
  cssDir = 'css' + path.sep,
  jsDir = 'js' + path.sep,
  imgDir = 'img' + path.sep,

  // path to assets
  cssFile = cssDir + 'comment.css',
  googlePath = jsDir + 'google-code-prettify' + path.sep,
  googlePrettifyCss = googlePath + 'prettify.css',
  googlePrettifyJs = googlePath + 'prettify.js',

  // required js file
  docs = jsDir + 'docs.js',
  srcFolder = 'src';


// normalized __dirname path (must have quotes on windows)
function getRootPath(file) {
  var dirpath = path.normalize(__dirname) + path.sep + templateSrc + file;
  if (!isWindows) {
    return dirpath;
  } else {
    return ('\"' + dirpath + '\"');
  }
}

function _writeFile(file, content, callback) {
  fs.writeFile(file, content, function (error) {
    if (error) {
      throw error;
    }

    if (typeof callback === 'function') {
      callback();
    }
  });
}

function _readFileSync(file) {
  file = file.replace(/"/g, '');
  return fs.readFileSync(file, "utf-8");
}

function forEach(arr, callback) {
  var i, l = arr.length;
  for (i = 0; i < l; i++) {
    if (callback.call(arr[i], arr[i], i, arr) === false) {
      break;
    }
  }
  return arr;
}

function main(files) {
  // default target dir to the cwd
  var currentDir = process.cwd(),
    sourceLinks = [],
    chunks = {},
    title = "",
    outputFile,
    outputPath = "docs",
    scripts = [],
    stylesheets = [],
    toc = [],
    sourceDir = currentDir + path.sep,
    filesSource = [],
    options,
    fileRegex,
    configFileName,
    json,
    indexOfConfigFile;

  // remove first two args
  files.splice(0, 2);

  // no files, exit
  if (!files.length || /''/.test(files[0]) || !files[0]) {
    console.log("Usage: " + (module.parent ? "comment-js " : "node comment.js ") + "<file1.js file2.js or a .json file>");
    process.exit(1);
  }

  function changeFileExt(file, ext) {
    return path.basename(file, path.extname(file)) + ext;
  }

  function normalizeOutputPath() {
    // strip extension from path if any
    if (path.extname(outputPath)) {
      outputPath = path.dirname(outputPath);
    }
    // get absolute path
    outputPath = path.resolve(outputPath) + path.sep;
    return outputPath;
  }

  function normalizeOutputFile() {
    // if no output, set default output filename
    // to be the same as the first filename
    if (!outputFile) {
      outputFile = files[0];
    }
    // normalize output file extension to be .html
    if (path.extname(outputFile) !== '.html') {
      outputFile = outputPath + changeFileExt(outputFile, '.html');
    }
    return outputFile;
  }

  // generate src file name
  function createSrcFileName(file) {
    return path.resolve(outputPath, srcFolder, changeFileExt(file, '-src.html'));
  }

  function isDirectory(folder) {
    if (typeof folder !== 'string') {
      return false;
    }
    return fs.lstatSync(folder).isDirectory();
  }

  function pushFiles(file) {
    // external source file (e.g. github)
    var link = file.link,
      // set full file path
      filePath = sourceDir + (file.path || file),
      // get only filename
      filename = path.basename(file);

    // normalize file path
    file = path.normalize(filePath);

    if ((!fileRegex || fileRegex.test(filename)) && !isDirectory(file)) {
      files.push(file);
      if (link && typeof link === 'string') {
        sourceLinks.push(link);
      }
    }
  }

  // check for json config file
  if (files.length === 1 && path.extname(files[0]) === ".json") {
    configFileName = files[0];
    // parse json file
    json = JSON.parse(_readFileSync(files[0]));
    // get docs title
    title = json.title;
    // empty array
    files.shift();
    // user options
    options = json.options;
    filesSource = [];

    // source is required
    if (!options || !options.source || !options.source.length) {
      console.log("Specify a source on your json config file");
      process.exit(1);
    }

    if (options.regex) {
      fileRegex = new RegExp(options.regex);
    }

    // check if source is a directory
    if (isDirectory(options.source)) {
      // set correct source directory to look for files
      // sourceDir += path.basename(options.source) + path.sep;
      sourceDir = options.source + path.sep;
      // get all files in directory
      filesSource = fs.readdirSync(sourceDir);

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
    forEach(filesSource, pushFiles);

    // get output dir
    outputFile = options.output;
    outputPath = options.output || outputPath;
    // any scripts to include in doc file? (e.g for code demos)
    scripts = options.scripts || scripts;
  }

  // no files to parse, exit
  if (!files.length) {
    console.log('comment.js ended without parsing any file');
    process.exit(1);
  }


  // normalize output
  outputPath = normalizeOutputPath();
  outputFile = normalizeOutputFile();

  // processing function
  function generateDocs() {
    console.log('\nGenerating output...');

    forEach(files, function (file, i) {
      console.log("Processing " + file);
      var code = _readFileSync(file),
        sourceFileName = sourceLinks[i] || createSrcFileName(file),
        // parse file content
        res = docit(code, file, sourceFileName),
        key;

      if (res.sections && res.source) {
        toc = toc.concat(res.toc);
        for (key in res.chunks) {
          if (res.chunks.hasOwnProperty(key)) {
            chunks[key] = res.chunks[key];
          }
        }
        title = title || res.title;

        console.log("Found \033[32m" + res.sections + "\033[0m sections.");
        console.log("Processing \033[32m" + res.loc + "\033[0m lines of code...");

        // if no source link create local src file
        if (!sourceLinks[i]) {
          _writeFile(sourceFileName, res.source);
        }

      // no comment-js format? warn but continue to next file
      } else {
        console.log("\033[31mNo comment-js format found in\033[0m " + file);
      }
    });

    var TOC = "",
      RES = "",
      html;

    forEach(toc, function (currentToc, i) {
      // ensure no toc.name duplication
      if (!i || currentToc.name !== toc[i - 1].name) {
        TOC += '<li class="cjs-lvl-' + currentToc.indent + '"><a href="#' + currentToc.name + '">' + currentToc.name + currentToc.brackets + '</a></li>';
        RES += chunks[currentToc.name] || "";
      }
    });

    // get base template
    html = _readFileSync(getRootPath(templateFile));

    // replace template variables
    html = html
      .replace(/\{title\}/g, title)
      .replace(/\{TOC\}/, TOC)
      .replace(/\{RES\}/, RES);


    // helper for linking resources
    function addResources(resources, type) {
      var str = '',
        tmpl = {
          script: '<script src="{path}"></script>\n',
          stylesheet: '<link rel="stylesheet" href="{path}">\n'
        };

      forEach(resources, function (res) {
        str += tmpl[type].replace(/\{path\}/, res);
      });

      html = html.replace('{' + type + 's}', str);
    }

    // link resources
    addResources([googlePrettifyCss, cssFile], 'stylesheet');
    addResources([googlePrettifyJs, docs].concat(scripts), 'script');

    // write output
    _writeFile(outputFile, html, function () {
      console.log('\n\nFinished!\n---------\nOutput: \033[32m' + outputFile + '\033[0m');
    });
  }

  // create output directories
  exec(mkdir + outputPath + (!sourceLinks.length ? srcFolder : ''), function () {
    // generate docs after output folder cause may not be created yet
    generateDocs();
  });

  function getResourcePath(dir) {
    return getRootPath(outputFilesDir + dir + '*.*');
  }

  // bring required files
  forEach([cssDir, jsDir, googlePath, imgDir], function (folder) {
    exec(mkdir + outputPath + folder, function () {
      exec(cp + getResourcePath(folder) + ' ' + outputPath + folder);
    });
  });
}


// if comment-js has been required return the main function
if (module.parent) {
  module.exports = main;

// if not, execute the script
} else {
  main(process.ARGV.slice(0));
}