var fs = require('fs');
var path = require('path');

var fstream = require("fstream");
var npm = require('npm');
var mkdir = require('mkdirp');
var rmrf = require('rimraf');
var semver = require('semver');
var slide = require('slide');
var tar = require('tar');
var zlib = require('zlib');

var stash = require('./stash');

module.exports = install;

function install(args) {
  var what = args[0];
  if (what) {
    var parts = what.split('@');
    var name = parts[0];
    var version = parts[1] || '*';
    installOne(name, version, function (err, what) {
      console.log('stash installed ' + what);
    });
  } else {
    var data = require(path.join(npm.prefix, 'package.json'));
    data.dependencies = data.dependencies || {};
    if (npm.config.get('dev') || !npm.config.get('production')) {
      Object.keys(data.devDependencies || {}).forEach(function (name) {
        data.dependencies[name] = data.devDependencies[name];
      })
    }
    slide.asyncMap(Object.keys(data.dependencies), function (name, callback) {
      installOne(name, data.dependencies[name], callback);
    }, function (err, results) {
      results.forEach(function (what) {
        console.log('stash installed ' + what);
      });
    });
  }
}

// Install a single package from the cache
function installOne(name, version, callback) {
  var target = path.join(npm.dir, name);
  var cache = path.join(stash.cache, name);
  var cb = function (err) {
    if (err) throw err;
    callback(err, name + '@' + version);
  };

  if (~version.indexOf('git+')) {
    var tarPath = path.join(cache, 'git.tar.gz');
    installCache(name, version, tarPath, function () {
      extractCache(tarPath, cb)
    });
  } else {
    npm.registry.get(name, function (err, data) {
      if (err) throw err;
      version = semver.maxSatisfying(Object.keys(data.versions), version);
      var tarPath = path.join(cache, version + '.tar.gz');
      if (fs.existsSync(tarPath)) {
        extractCache(tarPath, cb);
      } else {
        installCache(name, name + '@' + version, tarPath, function () {
          extractCache(tarPath, cb);
        });
      }
    });
  }
}

// Extract a package from the cache to node_modules
function extractCache(tarPath, callback) {
  fstream.Reader(tarPath)
    .pipe(zlib.createGunzip())
    .pipe(tar.Extract({ path: npm.dir }))
    .on('end', function () {
      callback();
    });
}

// Install the package to the cache
function installCache(name, what, tarPath, callback) {
  var work = path.join(stash.cache, name, 'work');
  npm.commands.install(work, what, function (err) {
    if (err) throw err;
    packDir(path.join(work, 'node_modules', name), tarPath, function () {
      rmrf(work, function () {
        callback();
      });
    });
  });
}

// Pack a directory into a file
function packDir(dir, file, callback) {
  fstream.Reader({ path: dir, type: 'Directory' })
    .pipe(tar.Pack())
    .pipe(zlib.createGzip())
    .pipe(fstream.Writer(file).on('close', callback));
}
