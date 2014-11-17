/**
 Walk directory,
 list tree without regex excludes
 */

var fs = require('fs');
var path = require('path');

var walk = function (dir, regExcludes, done) {
    var results = [];

    fs.readdir(dir, function (err, list) {
        if (err) return done(err);

        var pending = list.length;
        if (!pending) return done(null, results);

        list.forEach(function (file) {
            file = path.join(dir, file);

            var excluded = false;
            var len = regExcludes.length;
            var i = 0;

            for (; i < len; i++) {
                if (file.match(regExcludes[i])) {
                    excluded = true;
                }
            }

            // Add if not in regExcludes
            if(excluded === false) {
                results.push(file);

                // Check if its a folder
                fs.stat(file, function (err, stat) {
                    if (stat && stat.isDirectory()) {

                        // If it is, walk again
                        walk(file, regExcludes, function (err, res) {
                            results = results.concat(res);

                            if (!--pending) { done(null, results); }

                        });
                    } else {
                        if (!--pending) { done(null, results); }
                    }
                });
            } else {
                if (!--pending) { done(null, results); }
            }
        });
    });
};

var regExcludes = [/index\.html/, /js\/lib\.js/, /node_modules/];

walk('.', regExcludes, function(err, results) {
    if (err) {
        throw err;
    }
    console.log(results);
});