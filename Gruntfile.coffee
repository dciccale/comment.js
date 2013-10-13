module.exports = ->

  @initConfig
    CSS_DIR: 'lib/template/src/css/'
    CSS_DEBUG_FILE: '<%= CSS_FILE %>docs.css',
    CSS_MIN_FILE: 'lib/template/css/docs.min.css',
    JS_DIR: 'lib/template/src/js/',
    JS_FILE: 'lib/template/js/docs.min.js'

    jshint:
      options:
        jshintrc: '.jshintrc'

      lib:
        src: ['lib/comment.js', 'lib/doc.js', '<%= JS_DIR %>tocfilter.js']

    stylus:
      compile:
        files:
          '<%= CSS_DEBUG_FILE %>': ['<%= CSS_DIR %>styl/docs.styl']

    uglify:
      target:
        files:
          '<%= JS_FILE %>': ['<%= JS_DIR %>prettify.js', '<%= JS_DIR %>tocfilter.js']

    cssmin:
      compress:
        files:
          '<%= CSS_MIN_FILE %>': ['<%= CSS_DEBUG_FILE %>']

    watch:
      jshint:
        files: ['<%= jshint.lib.src %>']
        tasks: ['jshint', 'uglify']

      stylus:
        files: ['<%= CSS_DIR %>styl/comment.styl', '<%= CSS_DIR %>styl/src.styl'],
        tasks: ['stylus', 'cssmin']

  @loadNpmTasks 'grunt-contrib-jshint'
  @loadNpmTasks 'grunt-contrib-stylus'
  @loadNpmTasks 'grunt-contrib-cssmin'
  @loadNpmTasks 'grunt-contrib-uglify'
  @loadNpmTasks 'grunt-contrib-watch'

  @registerTask 'default', ['jshint', 'stylus', 'uglify', 'cssmin']
