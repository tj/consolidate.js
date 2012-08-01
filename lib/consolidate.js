
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

exports.jade.render = function(str, options, fn){
  var engine = requires.jade || (requires.jade = require('jade'));
  engine.render(str, options, fn);
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

exports.dust.render = function(str, options, fn){
  var engine = requires.dust;

  if (!engine) {
    try {
      requires.dust = require('dust');
    } catch (err) {
      requires.dust = require('dustjs-linkedin');
    }
    engine = requires.dust;
  }

  var tmpl = cache[str];

  // try cache (only if cached is a compiled template function and not a string)
  if (options.cache && tmpl && 'function' == typeof tmpl) {
    tmpl(options, fn);
  } else {
    try {
      tmpl = engine.compileFn(str);

      if (options.cache) cache[str] = tmpl;
      else engine.cache = {};

      tmpl(options, fn);
    } catch (err) {
      fn(err);
    }
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
exports.swig.render = function(str, options, fn){
  var engine = requires.swig || (requires.swig = require('swig'));
  try {
    var tmpl = engine.compile(str, options);
    fn(null, tmpl(options));
  } catch (err) {
    fn(err);
  }
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
exports.liquor.render = function(str, options, fn){
  var engine = requires.liquor || (requires.liquor = require('liquor'));
  try {
    var tmpl = engine.compile(str, options);
    fn(null, tmpl(options));
  } catch (err) {
    fn(err);
  }
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
exports.ejs.render = function(str, options, fn){
  var engine = requires.ejs || (requires.ejs = require('ejs'));
  try {
    var tmpl = engine.compile(str, options);
    fn(null, tmpl(options));
  } catch (err) {
    fn(err);
  }
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

exports.jazz.render = function(str, options, fn){
  var engine = requires.jazz || (requires.jazz = require('jazz'));
  try {
    var tmpl = engine.compile(str, options);
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

exports['haml-coffee'] = function(path, options, fn){
  var engine = requires.HAMLCoffee || (requires.HAMLCoffee = require('haml-coffee'));
  var tmpl = cache[path];

  // try cache (only if cached is a compiled template function and not a string)
  if (options.cache && tmpl && 'function' == typeof tmpl) {
    try {
      var html = tmpl(options);
      fn(null, html);
    } catch (err) {
      fn(err);
    }
  } else {
    read(path, options, function(err, str) {
      if (err) return fn(err);
      try {
        var tmpl = engine.compile(str, options);
        cache[path] = tmpl;
        fn(null, tmpl(options));
      } catch (err) {
        fn(err);
      }
    });
  }
};
exports['haml-coffee'].render = function(str, options, fn){
  var engine = requires.HAMLCoffee || (requires.HAMLCoffee = require('haml-coffee'));
  try {
    var tmpl = engine.compile(str, options);
    fn(null, tmpl(options));
  } catch (err) {
    fn(err);
  }
};

/**
 * Hogan support.
 */

exports.hogan = function(path, options, fn){
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

exports.hogan.render = function(str, options, fn){
  var engine = requires.hogan || (requires.hogan = require('hogan.js'));
  try {
    var tmpl = engine.compile(str, options);
    fn(null, tmpl.render(options));
  } catch (err) {
    fn(err);
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
};
exports.handlebars.render = function(str, options, fn) {
  var engine = requires.handlebars || (requires.handlebars = require('handlebars'));
  try {
    var tmpl = engine.compile(str, options);
    fn(null, tmpl(options));
  } catch (err) {
    fn(err);
  }
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
};
exports.underscore.render = function(str, options, fn) {
  var engine = requires.underscore || (requires.underscore = require('underscore'));
  try {
    var tmpl = engine.template(str, null, options);
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
exports.walrus.render = function (str, options, fn) {
  var engine = requires.walrus || (requires.walrus = require('walrus'));
  var tmpl = cache[str];

  // try cache (only if cached is a compiled template function and not a string)
  if (options.cache && tmpl && 'function' == typeof tmpl) {
    tmpl(options, fn);
  } else {
    try {
      var tmpl = engine.parse(str);
      fn(null, tmpl.compile(options));
    } catch (err) {
      fn(err);
    }
  }
};

/**
 * Mustache support.
 */

exports.mustache = function(path, options, fn) {
  var engine = requires.mustache || (requires.mustache = require('mustache'));
  read(path, options, function(err, str){
    if (err) return fn(err);
    try {
      options.filename = path;
      fn(null, engine.to_html(str, options));
    } catch (err) {
      fn(err);
    }
  });
};
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

exports.dot = function(path, options, fn) {
  var engine = requires.dot || (requires.dot = require('dot'));
  var tmpl = cache[path];

  // try cache (only if cached is a compiled template function and not a string)
  if (options.cache && tmpl && 'function' == typeof tmpl) {
    try {
      var html = tmpl(options);
      fn(null, html);
    } catch (err) {
      fn(err);
    }
  } else {
    read(path, options, function(err, str) {
      if (err) return fn(err);
      try {
        var tmpl = engine.template(str);
        cache[path] = tmpl;
        fn(null, tmpl(options));
      } catch (err) {
        fn(err);
      }
    });
  }
};
exports.dot.render = function(str, options, fn) {
  var engine = requires.dot || (requires.dot = require('dot'));
  var tmpl = cache[str];

  // try cache (only if cached is a compiled template function and not a string)
  if (options.cache && tmpl && 'function' == typeof tmpl) {
    try {
      var html = tmpl(options);
      fn(null, html);
    } catch (err) {
      fn(err);
    }
  } else {
    try {
      var tmpl = engine.template(str);
      cache[str] = tmpl;
      fn(null, tmpl(options));
    } catch (err) {
      fn(err);
    }
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