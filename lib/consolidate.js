
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

exports.version = '0.3.0';

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

  if (!engine) {
    try {
      requires.dust = require('dust');
    } catch (err) {
      requires.dust = require('dustjs-linkedin');
    }
    engine = requires.dust;
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
  engine.__express(path, options, fn);
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
 * Hogan support.
 */
hoganCompiled = {};
exports['hogan'] = function(path, options, fn){
  var cache = hoganCompiled[path];
  if (options.cache && cache)
    fn(null, cache.tmpl.render(options, cache.refs));
  var engine = requires.hogan || (requires.hogan = require('hogan.js'))
  , basePath = path.substring(0, path.lastIndexOf('/') + 1)
  , extension = path.substring(path.lastIndexOf('.'))
  , hoganOptions = options.settings['view options']
  , delimiters = hoganOptions && hoganOptions.delimiters;
  read(path, options, function(err, str) {
    if (err) return fn(err);
    try {
      collectRefNames(str);
    } catch (err) {
      fn(err);
    }
  });
  // The functions which collaborate with the complete rendering process
  // are defined in the order they are invoked for better readability
  // 1 - Collect a list of partial/super templates names referenced in the source
  function collectRefNames(source) {
    var tokens = engine.scan(source, delimiters);
    var refNames = [];
    while (tokens.length > 0) {
      token = tokens.shift();
      if (token.tag == '<' || token.tag == '>')
        refNames.push(token.n.trim());
    }
    var refs = {};
    if(refNames.length > 0)
      readRefs(source, refNames, refs); 
    else
      compile(source, refs);
  }
  // 2 - Read the referenced templates from the fs
  function readRefs(source, refNames, refs) {
    var refName = refNames.shift();
    read(basePath + refName + extension, options, function(err, str){
      if (err) return fn(err);
      refs[refName] = str;
      if (refNames.length > 0)
        readRefs(source, refNames, refs);
      else
        compile(source, refs);
    });
  }
  // 3 - Compile and render the source
  function compile(source, refs) {
    try {
      var tmpl = engine.compile(source, hoganOptions);
      // In production the compiled function and its partial/super 
      // templates will be cached for maximum speed
      if (options.cache)
        hoganCompiled[path] = {tmpl:tmpl, refs:refs};
      fn(null, tmpl.render(options, refs));
    } catch (err) {
      fn(err);
    }
  }
};

/**
 * Handlebars support.
 */

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

/**
 * Underscore support.
 */

exports.underscore = function(path, options, fn) {
  var engine = requires.underscore || (requires.underscore = require('underscore'));
  read(path, options, function(err, str){
    if (err) return fn(err);
    try {
      options.filename = path;
      var tmpl = engine.template(str, null, options);
      fn(null, tmpl(options).replace(/\n$/, ''));
    } catch (err) {
      fn(err);
    }
  });
}
