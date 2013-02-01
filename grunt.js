module.exports = function (grunt) {

  grunt.initConfig({
    paths: {
      cssSrc: 'lib/template/src/css/',
      cssDebugOutput: '<%= paths.cssSrc %>docs.css',
      cssMinOutput: 'lib/template/css/docs.min.css',
      jsSrc: 'lib/template/src/js/',
      jsOutput: 'lib/template/js/docs.min.js'
    },

    stylusOutput: {
      '<%= paths.cssDebugOutput %>': '<%= paths.cssSrc %>styl/docs.styl'
    },

    pkg: '<json:package.json>',

    lint: {
      files: ['grunt.js', 'lib/comment.js', '<%= paths.jsSrc %>tocfilter.js']
    },

    stylus: {
      compile: {
        files: '<config:stylusOutput>'
      }
    },

    min: {
      dist: {
        src: ['<%= paths.jsSrc %>prettify.js', '<%= paths.jsSrc %>tocfilter.js'],
        dest: '<%= paths.jsOutput %>'
      }
    },

    mincss: {
      dist: {
        src: ['<%= paths.cssDebugOutput %>'],
        dest: '<%= paths.cssMinOutput %>'
      }
    },

    watch: {
      files: ['<config:lint.files>', '<%= paths.cssSrc %>styl/comment.styl', '<%= paths.cssSrc %>styl/src.styl'],
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
        node: true,
        strict: false
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
