#!/usr/bin/env node
var crypto = require('crypto');
var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');

var chain = require('slide').chain;
var osenv = require('osenv');

var cache = path.resolve(osenv.home(), '.npm-stash');

// Ensure .npm-stash folder exists
if (!fs.existsSync(cache)) {
  fs.mkdirSync(cache);
}

var command = process.argv[2];
if (command !== 'install') {
   return log('Unknown command');
}

function log(dir, msg) {
  console.log('stash - ' + (msg ? dir + ' - ' : '') + msg);
}

function generateHash(s) {
  var h = crypto.createHash('sha256');
  h.setEncoding('hex');
  h.write(s);
  h.end();
  return h.read();
}

function npm(dir, command, callback) {
  log(dir, 'npm ' + command);
  var p = spawn(
    'npm',
    [command],
    { stdio: ['ignore', 'pipe', process.stderr] }
  );
  var out = '';
  p.stdout.on('data', function (data) {
    out += data;
  });
  p.on('close', function () {
    callback(null, out);
  });
}

function unpack(tarPath, target, callback) {
  log(target, 'extracting archive');
  spawn(
    'tar',
    ['-xvf', tarPath, '-C', target],
    { stdio: 'ignore' }
  ).on('close', callback);
}

function pack(source, tarPath, callback) {
  log(source, 'creating archive');
  spawn(
    'tar',
    ['-cvf', tarPath, '-C', source, 'node_modules'],
    { stdio: 'ignore' }
  ).on('close', callback);
}

npm(process.cwd(), 'prefix', function (err, prefix) {
  prefix = prefix.replace('\n', '');
  npm = npm.bind(null, prefix);

  var projectName = require(prefix + '/package.json').name;
  var hash = generateHash(projectName);
  var tarPath = path.join(cache, hash + '.tar.gz');
  var exists = fs.existsSync(tarPath);
  chain([
    exists && [unpack, tarPath, prefix],
    exists && [npm, 'prune'],
    [npm, 'install'],
    [pack, prefix, tarPath]
  ], function (err, a, b) {
    if (err) {
      return log(prefix, 'error:', err);
    }
    log(prefix, 'done for hashKey: ' + projectName);
  });
});
