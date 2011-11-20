
/*!
 * consolidate
 * Copyright(c) 2011 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var fs = require('fs');

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

exports.render.swig = function(path, options, fn){
  var engine = require('swig');
  fs.readFile(path, 'utf8', function(err, str){
    if (err) return fn(err);
    try {
      var tmpl = engine.compile(str, options);
      fn(null, tmpl(options));
    } catch (err) {
      fn(err);
    }
  });
};

exports.render.liquor = function(path, options, fn){
  var engine = require('liquor');
  fs.readFile(path, 'utf8', function(err, str){
    if (err) return fn(err);
    try {
      var tmpl = engine.compile(str, options);
      fn(null, tmpl(options));
    } catch (err) {
      fn(err);
    }
  });
};

exports.render.ejs = function(path, options, fn){
  var engine = require('ejs');
  fs.readFile(path, 'utf8', function(err, str){
    if (err) return fn(err);
    try {
      var tmpl = engine.compile(str, options);
      fn(null, tmpl(options));
    } catch (err) {
      fn(err);
    }
  });
};

exports.render.jazz = function(path, options, fn){
  var engine = require('jazz');
  fs.readFile(path, 'utf8', function(err, str){
    if (err) return fn(err);
    try {
      var tmpl = engine.compile(str, options);
      tmpl.eval(options, function(str){
        fn(null, str);
      });
    } catch (err) {
      fn(err);
    }
  });
};

exports.render.jqtpl = function(path, options, fn){
  var engine = require('jqtpl');
  fs.readFile(path, 'utf8', function(err, str){
    if (err) return fn(err);
    try {
      engine.template(path, str);
      fn(null, engine.tmpl(path, options));
    } catch (err) {
      fn(err);
    }
  });
};