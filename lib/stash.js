var path = require('path');
var osenv = require('osenv');

var stash = module.exports = {};

stash.cache = path.resolve(osenv.home(), '.npm-stash');
