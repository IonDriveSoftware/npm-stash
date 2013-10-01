#!/usr/bin/env node
var path = require('path');

var nopt = require('nopt');
var npm = require('npm');

var stash = require('../lib/stash');

stash.config = nopt({
  //'save': Boolean,
  //'save-dev': Boolean,
  //'save-optional': Boolean,
  'dev': Boolean,
  'production': Boolean
});

stash.argv = stash.config.argv.remain;
stash.command = stash.argv.shift();

npm.load(stash.config, function (err) {
  if (err) return console.log(err);
  if (stash.command) {
    require('../lib/' + stash.command)(stash.argv);
  } else {
    console.log('Usage: TODO');
  }
});
