var gulp = require('gulp');
var mocha = require('gulp-mocha');
var shell = require('gulp-shell');

var paths = {
    test: [
        './src/**/*.js',
        './index.js',
        'test/**/spec*.js'
    ]
};

gulp.task('test', function() {
    gulp.start('test-once')
        .watch(paths.test, ['test-once']);

});

gulp.task('test-once', function() {
    return gulp.src(paths.test, {read: false})
        .pipe(mocha());
});

gulp.task('release', function () {
    // copy file
    gulp.src('')
        .pipe(shell(['npm version patch']))
        .pipe(shell(['npm pack']))
        .pipe(shell('mkdir -p ./dist && mv *.tgz ./dist/ngrequire.tgz'))
});
