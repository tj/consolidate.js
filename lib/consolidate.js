
/*!
 * consolidate
 * Copyright(c) 2011 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Library version.
 */

exports.version = '0.0.1';

/**
 * Require cache.
 */

var cache = {};

exports.render = function(){
  
};

exports.render.jade = function(path, options, fn){
  var jade = require('jade');
  jade.renderFile(path, options, fn);
};