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

  // cached (only if cached is a string and not a compiled template function)
  if (options.cache && str && typeof str === 'string') return fn(null, str);

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

  var tmpl = cache[path];

  // try cache (only if cached is a compiled template function and not a string)
  if (options.cache && tmpl && 'function' == typeof tmpl) {
    tmpl(options, fn);
  } else {
    read(path, options, function(err, str) {
      if (err) return fn(err);
      try {
        options.filename = path;
        tmpl = engine.compileFn(str);

        if (options.cache) cache[path] = tmpl;
        else engine.cache = {};

        tmpl(options, fn);
      } catch (err) {
        fn(err);
      }
    });
  }
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
var hoganCompiled = {};
exports['hogan'] = function(path, options, fn){
  var cache = hoganCompiled[path];
  if (options.cache && cache)
    fn(null, cache.tmpl.render(options, cache.refs));
  var engine = requires.hogan || (requires.hogan = require('hogan.js'))
  , basePath = path.substring(0, path.lastIndexOf('/') + 1)
  , extension = path.substring(path.lastIndexOf('.'))
  , hoganOptions = options.settings['view options']
  , delimiters = hoganOptions && hoganOptions.delimiters;
  read(path, options, function(err, src) {
    if (err) return fn(err);
    try {
      var names = getRefNames(src);
      var refs = {};
      var ready = [];
      if (names.length > 0) {
        collectRefs(names, refs, function(tmplName) {
          ready.push(tmplName);
          if (names.length === ready.length)
            compile(src, refs);
        });
      } else {
        compile(src, refs);
      }
    } catch (err) {
      fn(err);
    }
  });
  // Reads a list of partial/super templates names referenced in the source
  function getRefNames(src) {
    var tokens = engine.scan(src, delimiters);
    var rv = [];
    while (tokens.length > 0) {
      var token = tokens.shift();
      if (token.tag == '<' || token.tag == '>') 
        rv.push(token.n.trim());
    }
    return rv;
  }
  // Recursively collects the all referenced templates from the fs
  function collectRefs(names, refs, readyCb) {
    for (var i = 0;i < names.length;i++) {
      var name = names[i];
      if (name in refs) {
        readyCb(name); // stored templates are ready
        continue; 
      }
      (function(name) {
        read(basePath + name + extension, options, function(err, src){
          if (err) return fn(err);
          refs[name] = engine.compile(src, hoganOptions);
          var subNames = getRefNames(src);
          if (subNames.length > 0) {
            var subReady = [];
            collectRefs(subNames, refs, function(tmplName) {
              subReady.push(tmplName);
              // a referenced template is only ready when all of its
              // referenced templates are also ready
              if (subNames.length === subReady.length)
                readyCb(name);
            });
          }
          else
            readyCb(name);
        });
      })(name);
    }
  }
  // Compile and render the source
  function compile(src, refs) {
    try {
      var tmpl = engine.compile(src, hoganOptions);
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
 * Walrus support.
 */

exports.walrus = function (path, options, fn) {
  var engine = requires.walrus || (requires.walrus = require('walrus'));
  var tmpl = cache[path];

  // try cache (only if cached is a compiled template function and not a string)
  if (options.cache && tmpl && 'function' == typeof tmpl) {
    tmpl(options, fn);
  } else {
    read(path, options, function(err, str){
      if (err) return fn(err);
      try {
        var tmpl = engine.parse(str);
        fn(null, tmpl.compile(options));
      } catch (err) {
        fn(err);
      }
    });
  }
};
