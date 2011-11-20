
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

/**
 * Jade support.
 */

exports.render.jade = function(path, options, fn){
  var jade = require('jade');
  jade.renderFile(path, options, fn);
};

/**
 * Swig support.
 */

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

/**
 * Liquor support,
 */

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

/**
 * EJS support.
 */

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

/**
 * Eco support.
 */

exports.render.eco = function(path, options, fn){
  var engine = require('eco');
  fs.readFile(path, 'utf8', function(err, str){
    if (err) return fn(err);
    try {
      fn(null, engine.render(str, options));
    } catch (err) {
      fn(err);
    }
  });
};

/**
 * Jazz support.
 */

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

/**
 * JQTPL support.
 */

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

/**
 * Haml support.
 */

exports.render.haml = function(path, options, fn){
  var engine = require('hamljs');
  fs.readFile(path, 'utf8', function(err, str){
    if (err) return fn(err);
    try {
      options.locals = options;
      fn(null, engine.render(str, options).trimLeft());
    } catch (err) {
      fn(err);
    }
  });
};