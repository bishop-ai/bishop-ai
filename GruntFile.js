module.exports = function (grunt) {
    'use strict';

    var srcJs = [
        './src/**/*.js'
    ];

    // Setup Grunt tasks
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        uglify: {
            main: {
                options: {
                    mangle: false,
                    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */',
                    sourceMap: false
                },
                src: 'dist/bishop-ai-core.js',
                dest: 'dist/bishop-ai-core.min.js'
            }
        },

        browserify: {
            dist: {
                options: {
                    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */',
                    external: ['axios', 'compendium', 'humanize-duration', 'moment', 'Q']
                },
                src: srcJs,
                dest: 'dist/bishop-ai-core.js'
            }
        }
    });

    // Load the Grunt plugins
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-browserify');

    // Runs unit tests
    grunt.registerTask('default', ['browserify', 'uglify']);
};
