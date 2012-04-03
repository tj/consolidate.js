
/*!
 * consolidate
 * Copyright(c) 2011 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 * 
 * Engines which do not support caching of their file contents
 * should use the `read()` function defined in consolidate.js
 * On top of this, when an engine compiles to a `Function`,
 * these functions should either be cached within consolidate.js
 * or the engine itself via `options.cache`. This will allow
 * users and frameworks to pass `options.cache = true` for
 * `NODE_ENV=production`, however edit the file(s) without
 * re-loading the application in development.
 */

/**
 * Module dependencies.
 */

var fs = require('fs');

/**
 * Library version.
 */

exports.version = '0.1.0';

/**
 * Require cache.
 */

var cache = {};

/**
 * Require cache.
 */

var requires = {};

/**
 * Clear the cache.
 *
 * @api public
 */

exports.clearCache = function(){
  cache = {};
};

/**
 * Read `path` with `options` with
 * callback `(err, str)`. When `options.cache`
 * is true the template string will be cached.
 *
 * @param {String} options
 * @param {Function} fn
 * @api private
 */

function read(path, options, fn) {
  var str = cache[path];

  // cached
  if (options.cache && str) return fn(null, str);

  // read
  fs.readFile(path, 'utf8', function(err, str){
    if (err) return fn(err);
    if (options.cache) cache[path] = str;
    fn(null, str);
  });
}

/**
 * Jade support.
 */

exports.jade = function(path, options, fn){
  var engine = requires.jade || (requires.jade = require('jade'));
  engine.renderFile(path, options, fn);
};

/**
 * Dust support.
 */

exports.dust = function(path, options, fn){
  var engine = requires.dust;

  if( !engine ) {
    engine = requires.dust = require('dust');
    engine.onLoad = function(path, callback) { read(path, options, callback); }
  }

  read(path, options, function(err, str) {
    if (err) return fn(err);
    try {
      options.filename = path;
      engine.renderSource(str, options, function(err, tmpl) {
        fn(err, tmpl);
      });
    } catch (err) {
      fn(err);
    }
  });
};

/**
 * Swig support.
 */

exports.swig = function(path, options, fn){
  var engine = requires.swig || (requires.swig = require('swig'));
  read(path, options, function(err, str){
    if (err) return fn(err);
    try {
      options.filename = path;
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

exports.liquor = function(path, options, fn){
  var engine = requires.liquor || (requires.liquor = require('liquor'));
  read(path, options, function(err, str){
    if (err) return fn(err);
    try {
      options.filename = path;
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

exports.ejs = function(path, options, fn){
  var engine = requires.ejs || (requires.ejs = require('ejs'));
  read(path, options, function(err, str){
    if (err) return fn(err);
    try {
      options.filename = path;
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

exports.eco = function(path, options, fn){
  var engine = requires.eco || (requires.eco = require('eco'));
  read(path, options, function(err, str){
    if (err) return fn(err);
    try {
      options.filename = path;
      fn(null, engine.render(str, options));
    } catch (err) {
      fn(err);
    }
  });
};

/**
 * Jazz support.
 */

exports.jazz = function(path, options, fn){
  var engine = requires.jazz || (requires.jazz = require('jazz'));
  read(path, options, function(err, str){
    if (err) return fn(err);
    try {
      options.filename = path;
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

exports.jqtpl = function(path, options, fn){
  var engine = requires.jqtpl || (requires.jqtpl = require('jqtpl'));
  read(path, options, function(err, str){
    if (err) return fn(err);
    try {
      options.filename = path;
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

exports.haml = function(path, options, fn){
  var engine = requires.hamljs || (requires.hamljs = require('hamljs'));
  read(path, options, function(err, str){
    if (err) return fn(err);
    try {
      options.filename = path;
      options.locals = options;
      fn(null, engine.render(str, options).trimLeft());
    } catch (err) {
      fn(err);
    }
  });
};

/**
 * Whiskers support.
 */

exports.whiskers = function(path, options, fn){
  var engine = requires.whiskers || (requires.whiskers = require('whiskers'));
  read(path, options, function(err, str){
    if (err) return fn(err);
    try {
      fn(null, engine.render(str, options));
    } catch (err) {
      fn(err);
    }
  });
};

/**
 * Coffee-HAML support.
 */

exports['haml-coffee'] = function(path, options, fn){
  var engine = requires.HAMLCoffee || (requires.HAMLCoffee = require('haml-coffee'));
  read(path, options, function(err, str){
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
 * Kernel support.
 */

exports['kernel'] = function(path, options, fn){
  var engine = requires.kernel || (requires.kernel = require('kernel'));
  engine.cacheLifetime = options.cache;
  engine(path, function(err, tmpl){
    if (err) return fn(err);
    tmpl(options, fn);
  });
};

/**
 * Hogan support.
 */

exports['hogan'] = function(path, options, fn){
  var engine = requires.hogan || (requires.hogan = require('hogan.js'));
  read(path, options, function(err, str){
    if (err) return fn(err);
    try {
      var tmpl = engine.compile(str, options);
      fn(null, tmpl.render(options));
    } catch (err) {
      fn(err);
    }
  });
};

exports.handlebars = function(path, options, fn) {
	var engine = requires.handlebars || (requires.handlebars = require('handlebars'));
  read(path, options, function(err, str){
    if (err) return fn(err);
    try {
      options.filename = path;
      var tmpl = engine.compile(str, options);
      fn(null, tmpl(options));
    } catch (err) {
      fn(err);
    }
  });
}
