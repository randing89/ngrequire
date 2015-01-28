var gulp = require('gulp');
var shell = require('gulp-shell');

var paths = {
    test: [
        './src/**/*.js',
        './index.js',
        'test/**/spec*.js'
    ]
};

gulp.task('release', function () {
    // copy file
    gulp.src('')
        .pipe(shell(['npm version patch']))
        .pipe(shell(['npm publish']))
});
