
/*!
 * consolidate
 * Copyright(c) 2012 TJ Holowaychuk <tj@vision-media.ca>
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


var readCache = {};

/**
 * Require cache.
 */

var cacheStore = {};

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
  cacheStore = {};
};

function cache(options, compiled) {
  if (compiled && options.filename && options.cache) {
    delete readCache[options.filename];//don't need to cache in both locations
    cacheStore[options.filename] = compiled;
  } else if (options.filename && options.cache) {
    return cacheStore[options.filename];
  }
  return compiled;
}

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
  var str = readCache[path];

  // cached (only if cached is a string and not a compiled template function)
  if (options.cache && str && typeof str === 'string') return fn(null, str);

  // read
  fs.readFile(path, 'utf8', function(err, str){
    if (err) return fn(err);
    if (options.cache) readCache[path] = str;
    fn(null, str);
  });
}

/**
 * fromStringRenderer
 */

function fromStringRenderer(name) {
  return function(path, options, fn){
    options.filename = path;
    if (cache(options)) {
      exports[name].render('', options, fn);//string doesn't matter if it's in the cache.
    } else {
      read(path, options, function(err, str){
        if (err) return fn(err);
        exports[name].render(str, options, fn);
      });
    }
  };
}

/**
 * Jade support.
 */

exports.jade = function(path, options, fn){
  var engine = requires.jade || (requires.jade = require('jade'));
  engine.renderFile(path, options, fn);
};

exports.jade.render = function(str, options, fn){
  var engine = requires.jade || (requires.jade = require('jade'));
  engine.render(str, options, fn);
};

/**
 * Dust support.
 */

exports.dust = fromStringRenderer('dust');
exports.dust.render = function(str, options, fn){
  var engine = requires.dust;
  if (!engine) {
    try {
      engine = requires.dust = require('dust');
    } catch (err) {
      engine = requires.dust = require('dustjs-linkedin');
    }
  }

  try {
    var tmpl = cache(options) || cache(options, engine.compileFn(str));
    tmpl(options, fn);
  } catch (err) {
    fn(err);
  }
};

/**
 * Swig support.
 */

exports.swig = fromStringRenderer('swig');
exports.swig.render = function(str, options, fn){
  var engine = requires.swig || (requires.swig = require('swig'));
  try {
    var tmpl = cache(options) || cache(options, engine.compile(str, options));
    fn(null, tmpl(options));
  } catch (err) {
    fn(err);
  }
};

/**
 * Liquor support,
 */

exports.liquor = fromStringRenderer('liquor');
exports.liquor.render = function(str, options, fn){
  var engine = requires.liquor || (requires.liquor = require('liquor'));
  try {
    var tmpl = cache(options) || cache(options, engine.compile(str, options));
    fn(null, tmpl(options));
  } catch (err) {
    fn(err);
  }
};

/**
 * EJS support.
 */

exports.ejs = fromStringRenderer('ejs');
exports.ejs.render = function(str, options, fn){
  var engine = requires.ejs || (requires.ejs = require('ejs'));
  try {
    var tmpl = cache(options) || cache(options, engine.compile(str, options));
    fn(null, tmpl(options));
  } catch (err) {
    fn(err);
  }
};


/**
 * Eco support.
 */

exports.eco = fromStringRenderer('eco');
exports.eco.render = function(str, options, fn){
  var engine = requires.eco || (requires.eco = require('eco'));
  try {
    fn(null, engine.render(str, options));
  } catch (err) {
    fn(err);
  }
};

/**
 * Jazz support.
 */

exports.jazz = fromStringRenderer('jazz');

exports.jazz.render = function(str, options, fn){
  var engine = requires.jazz || (requires.jazz = require('jazz'));
  try {
    var tmpl = cache(options) || cache(options, engine.compile(str, options));
    tmpl.eval(options, function(str){
      fn(null, str);
    });
  } catch (err) {
    fn(err);
  }
};

/**
 * JQTPL support.
 */

exports.jqtpl = fromStringRenderer('jqtpl');

exports.jqtpl.render = function(str, options, fn){
  var engine = requires.jqtpl || (requires.jqtpl = require('jqtpl'));
  try {
    engine.template(str, str);
    fn(null, engine.tmpl(str, options));
  } catch (err) {
    fn(err);
  }
};

/**
 * Haml support.
 */

exports.haml = fromStringRenderer('haml');
exports.haml.render = function(str, options, fn){
  var engine = requires.hamljs || (requires.hamljs = require('hamljs'));
  try {
    options.locals = options;
    fn(null, engine.render(str, options).trimLeft());
  } catch (err) {
    fn(err);
  }
};

/**
 * Whiskers support.
 */

exports.whiskers = function(path, options, fn){
  var engine = requires.whiskers || (requires.whiskers = require('whiskers'));
  engine.__express(path, options, fn);
};
exports.whiskers.render = function(str, options, fn){
  var engine = requires.whiskers || (requires.whiskers = require('whiskers'));
  try {
    fn(null, engine.render(str, options));
  } catch (err) {
    fn(err);
  }
};

/**
 * Coffee-HAML support.
 */

exports['haml-coffee'] = fromStringRenderer('haml-coffee');
exports['haml-coffee'].render = function(str, options, fn){
  var engine = requires.HAMLCoffee || (requires.HAMLCoffee = require('haml-coffee'));
  try {
    var tmpl = cache(options) || cache(options, engine.compile(str, options));
    fn(null, tmpl(options));
  } catch (err) {
    fn(err);
  }
};

/**
 * Hogan support.
 */

exports.hogan = fromStringRenderer('hogan');
exports.hogan.render = function(str, options, fn){
  var engine = requires.hogan || (requires.hogan = require('hogan.js'));
  try {
    var tmpl = cache(options) || cache(options, engine.compile(str, options));
    fn(null, tmpl.render(options));
  } catch (err) {
    fn(err);
  }
};

/**
 * Handlebars support.
 */

exports.handlebars = fromStringRenderer('handlebars');
exports.handlebars.render = function(str, options, fn) {
  var engine = requires.handlebars || (requires.handlebars = require('handlebars'));
  try {
    var tmpl = cache(options) || cache(options, engine.compile(str, options));
    fn(null, tmpl(options));
  } catch (err) {
    fn(err);
  }
}

/**
 * Underscore support.
 */

exports.underscore = fromStringRenderer('underscore');
exports.underscore.render = function(str, options, fn) {
  var engine = requires.underscore || (requires.underscore = require('underscore'));
  try {
    var tmpl = cache(options) || cache(options, engine.template(str, null, options));
    fn(null, tmpl(options).replace(/\n$/, ''));
  } catch (err) {
    fn(err);
  }
};


/**
 * QEJS support.
 */

exports.qejs = function (path, options, fn) {
  try {
    var engine = requires.qejs || (requires.qejs = require('qejs'));
    engine.renderFile(path, options).then(function (result) {
        fn(null, result);
    }, function (err) {
        fn(err);
    }).end();
  } catch (err) {
    fn(err);
  }
};
exports.qejs.render = function (str, options, fn) {
  try {
    var engine = requires.qejs || (requires.qejs = require('qejs'));
    engine.render(str, options).then(function (result) {
        fn(null, result);
    }, function (err) {
        fn(err);
    }).end();
  } catch (err) {
    fn(err);
  }
};


/**
 * Walrus support.
 */

exports.walrus = fromStringRenderer('walrus');
exports.walrus.render = function (str, options, fn) {
  var engine = requires.walrus || (requires.walrus = require('walrus'));
  try {
    var tmpl = cache(options) || cache(options, engine.parse(str));
    fn(null, tmpl.compile(options));
  } catch (err) {
    fn(err);
  }
};

/**
 * Mustache support.
 */

exports.mustache = fromStringRenderer('mustache');
exports.mustache.render = function(str, options, fn) {
  var engine = requires.mustache || (requires.mustache = require('mustache'));
  try {
    fn(null, engine.to_html(str, options));
  } catch (err) {
    fn(err);
  }
};

/**
 * doT support.
 */

exports.dot = fromStringRenderer('dot');
exports.dot.render = function(str, options, fn) {
  var engine = requires.dot || (requires.dot = require('dot'));
  try {
    var tmpl = cache(options) || cache(options, engine.template(str));
    fn(null, tmpl(options));
  } catch (err) {
    fn(err);
  }
};

/**
 * Just support.
 */

exports.just = function(path, options, fn){
  var engine = requires.just;
  if (!engine) {
    var JUST = require('just');
    engine = requires.just = new JUST();
  }
  engine.configure({ useCache: options.cache });
  engine.render(path, options, fn);
};
exports.just.render = function(str, options, fn){
  var JUST = require('just');
  var engine = new JUST({ root: { page: str }});
  engine.render('page', options, fn);
};