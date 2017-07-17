

'use strict';

//package.json file
var pkg = require('./app/package');
//Shell for serving nw app
var shell = require('gulp-shell');
var gulp = require('gulp');
//Filesystem library
var jetpack = require('fs-jetpack');
//JS build Libraries
var usemin = require('gulp-usemin');
var uglify = require('gulp-uglify');

//library for building distributions of node-webkit apps
var NwBuilder = require('node-webkit-builder');

var projectDir = jetpack;
var srcDir = projectDir.cwd('./app');
var destDir = projectDir.cwd('./build');
var distDir = projectDir.cwd('./dist');

// -------------------------------------
// Tasks
// -------------------------------------

gulp.task('clean', function (callback) {
    distDir.dirAsync('.', { empty: true });
    return destDir.dirAsync('.', { empty: true });
});


gulp.task('copy', ['clean'], function () {
    return projectDir.copyAsync('app', destDir.path(), {
        overwrite: true,
        matching: [
            './node_modules/**/*',
            '*.json',
            '*.css',
            '*.svg',
            '*.html',
            'main.js',
            'package.json'
        ]
    });
});

gulp.task('copy-fonts', ['copy'], function () {
    return projectDir.copyAsync('app/assets/fonts', destDir.path() + '/assets/css', {
        overwrite: true
    });
});

gulp.task('build', ['copy-fonts'], function () {
    return gulp.src('./app/index.html')
        .pipe(usemin({
            js: [uglify()]
        }))
        .pipe(gulp.dest('build/'));
});

//For windows is needed double back slash to run
//TODO:Not supported yet for other SO
gulp.task('serve', shell.task([
  'node_modules\\.bin\\nw .\\app\\ --debug'
]));
//Build nw

gulp.task('build-nw', ['build'], function (){
  var nw = new NwBuilder({
      appName: pkg.window.title,
      appVersion: pkg.version,
      buildDir: './dist',
      files: ['./build/**'],
      platforms: ['win'],
      version: '0.12.3'
    });

    nw.on('log',console.log);

    return nw.build().catch(console.log);
});
