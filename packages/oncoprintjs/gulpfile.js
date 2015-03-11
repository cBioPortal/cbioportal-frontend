'use strict';

var autoprefixer = require('gulp-autoprefixer');
var browserify = require('browserify');
var cache = require('gulp-cache');
var concat = require('gulp-concat');
var del = require('del');
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var livereload = require('gulp-livereload');
var minifycss = require('gulp-minify-css');
var notify = require('gulp-notify');
var rename = require('gulp-rename');
var source = require('vinyl-source-stream');
var streamify = require('gulp-streamify');
var uglify = require('gulp-uglify');

// Test Page
gulp.task('test', function() {

  // JavaScript
  browserify({entries: './test/js/test_page.js',
              debug: true
             }).bundle()
  .pipe(source('test.js'))
  .pipe(rename('test_page_bundle.js'))
  .pipe(gulp.dest('dist/test/'))
  .pipe(streamify(uglify()))
  .pipe(notify("Done with building code for testing."))

  // Copy over the HTML.
  gulp.src('test/index.html')
  .pipe(gulp.dest('dist/test/'));

  // Copy over the data.
  gulp.src('test/data/**')
  .pipe(gulp.dest('dist/test/'));
});

// JavaScript
// TODO need to figure out what to compile other than test code...
//gulp.task('js', function() {
//  browserify({entries: './src/js/main.js',
//              debug: !process.env.production
//             }).bundle()
//  .pipe(source('genomic.js'))
//  .pipe(rename('genomic-oncoprint-bundle.js'))
//  .pipe(gulp.dest('dist/asset/js'))
//  .pipe(streamify(uglify()))
//  .pipe(notify("Done with JavaScript."))
//});

// Clean
gulp.task('clean', function(cb) {
    del(['dist'], cb)
});

// Default
gulp.task('default', ['clean'], function() {
    gulp.start('js');
});

// Watch
gulp.task('watch', function() {
  gulp.watch(['src/js/**/*.js', 'test/*.html', 'test/js/**/*.js'], ['test']);
});
