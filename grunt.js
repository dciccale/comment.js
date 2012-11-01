module.exports = function (grunt) {

  // css paths
  var cssOutputPath = 'lib/template/css/';
  var cssSrcPath = 'lib/template/src/css/';
  var cssDebugOutput = cssSrcPath + 'docs.css';
  var cssMinOutput = cssOutputPath + cssDebugOutput.replace(/.*(\/.*)(\.css)/, '$1.min$2');
  var stylusInput = cssSrcPath + 'styl/docs.styl';
  var stylusOutput = {};
  stylusOutput[cssDebugOutput] = [stylusInput];

  // js paths
  var jsOutputPath = 'lib/template/js/docs.min.js';
  var jsSrcPath = 'lib/template/src/js/';

  grunt.initConfig({
    pkg: '<json:package.json>',
    lint: {
      files: ['grunt.js', 'lib/comment.js', jsSrcPath + 'tocfilter.js']
    },
    stylus: {
      compile: {
        files: stylusOutput
      }
    },
    min: {
      dist: {
        src: [jsSrcPath + 'prettify.js', jsSrcPath + 'tocfilter.js'],
        dest: jsOutputPath
      }
    },
    mincss: {
      dist: {
        src: [cssDebugOutput],
        dest: cssMinOutput
      }
    },
    watch: {
      files: ['<config:lint.files>', cssSrcPath + 'styl/comment.styl', cssSrcPath + 'styl/src.styl'],
      tasks: 'lint min stylus mincss'
    },
    jshint: {
      options: {
        curly: true,
        immed: true,
        latedef: true,
        noarg: true,
        sub: true,
        undef: true,
        eqnull: true,
        node: true
      },
      globals: {
        window: true
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-stylus');
  grunt.loadNpmTasks('grunt-contrib-mincss');

  grunt.registerTask('default', 'lint min stylus mincss');

};