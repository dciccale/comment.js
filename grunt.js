module.exports = function (grunt) {

  grunt.initConfig({
    pkg: '<json:package.json>',
    lint: {
      files: ['grunt.js', 'lib/comment.js', 'lib/template/src/js/tocfilter.js']
    },
    stylus: {
      compile: {
        files: {
          'lib/template/src/css/docs.css': ['lib/template/src/css/styl/docs.styl']
        }
      }
    },
    min: {
      dist: {
        src: ['lib/template/src/js/prettify.js', 'lib/template/src/js/tocfilter.js'],
        dest: 'lib/template/js/docs.min.js'
      }
    },
    mincss: {
      dist: {
        src: ['lib/template/src/css/docs.css'],
        dest: 'lib/template/css/docs.min.css'
      }
    },
    watch: {
      files: ['<config:lint.files>', 'lib/template/css/styl/comment.styl', 'lib/template/css/styl/src.styl'],
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