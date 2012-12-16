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

var fs = require('fs')
  , path = require('path')
  , join = path.join
  , extname = path.extname
  , dirname = path.dirname;

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

/**
 * Conditionally cache `compiled` template based
 * on the `options` filename and `.cache` boolean.
 *
 * @param {Object} options
 * @param {Function} compiled
 * @return {Function}
 * @api private
 */

function cache(options, compiled) {
  if (compiled && options.filename && options.cache) {
    delete readCache[options.filename];
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
      exports[name].render('', options, fn);
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

/**
 * Jade string support.
 */

exports.jade.render = function(str, options, fn){
  var engine = requires.jade || (requires.jade = require('jade'));
  engine.render(str, options, fn);
};

/**
 * Dust support.
 */

exports.dust = fromStringRenderer('dust');

/**
 * Dust string support.
 */

exports.dust.render = function(str, options, fn){
  var engine = requires.dust;
  if (!engine) {
    try {
      engine = requires.dust = require('dust');
    } catch (err) {
      engine = requires.dust = require('dustjs-linkedin');
    }
  }

  var ext = 'dust'
    , views = '.';

  if (options) {
    if (options.ext) ext = options.ext;
    if (options.views) views = options.views;
    if (options.settings && options.settings.views) views = options.settings.views;
  }
  engine.onLoad = function(path, callback){
    if ('' == extname(path)) path += '.' + ext;
    if ('/' !== path[0]) path = views + '/' + path;
    read(path, options, callback);
  };

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

/**
 * Swig string support.
 */

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
 * Atpl support.
 */

exports.atpl = fromStringRenderer('atpl');

/**
 * Atpl string support.
 */

exports.atpl.render = function(str, options, fn){
  var engine = requires.atpl || (requires.atpl = require('atpl'));
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

/**
 * Liquor string support.
 */

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

/**
 * EJS string support.
 */

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

/**
 * Eco string support.
 */

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

/**
 * Jazz string support.
 */

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

/**
 * JQTPL string support.
 */

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

/**
 * Haml string support.
 */

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

/**
 * Whiskers string support.
 */

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

/**
 * Coffee-HAML string support.
 */

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

/**
 * Hogan string support.
 */

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

/**
 * Handlebars string support.
 */

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

/**
 * Underscore string support.
 */

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

/**
 * QEJS string support.
 */

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

/**
 * Walrus string support.
 */

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

/**
 * Mustache string support.
 */

exports.mustache.render = function(str, options, fn) {
  var engine = requires.mustache || (requires.mustache = require('mustache'));
  try {
    fn(null, engine.to_html(str, options));
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

/**
 * Just string support.
 */

exports.just.render = function(str, options, fn){
  var JUST = require('just');
  var engine = new JUST({ root: { page: str }});
  engine.render('page', options, fn);
};

/**
 * ECT support.
 */

exports.ect = function(path, options, fn){
  var engine = requires.ect;
  if (!engine) {
    var ECT = require('ect');
    engine = requires.ect = new ECT();
  }
  engine.configure({ cache: options.cache });
  engine.render(path, options, fn);
};

/**
 * ECT string support.
 */

exports.ect.render = function(str, options, fn){
  var ECT = require('ect');
  var engine = new ECT({ root: { page: str }});
  engine.render('page', options, fn);
};

/**
 * mote support.
 */

exports.mote = fromStringRenderer('mote');

/**
 * mote string support.
 */

exports.mote.render = function(str, options, fn){
  var engine = requires.mote || (requires.mote = require('mote'));
  try {
    var tmpl = cache(options) || cache(options, engine.compile(str));
    fn(null, tmpl(options));
  } catch (err) {
    fn(err);
  }
};

/**
 * Toffee support.
 */

exports.toffee = function(path, options, fn){
  var toffee = requires.toffee || (requires.toffee = require('toffee'));
  toffee.__consolidate_engine_render(path, options, fn);
};

/**
 * Toffee string support.
 */

exports.toffee.render = function(str, options, fn) {
  var engine = requires.toffee || (requires.toffee = require('toffee'));
  try {
  	engine.str_render(str, options,fn);
  } catch (err) {
    fn(err);
  }
}
