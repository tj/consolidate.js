'use strict';
/*
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

const fs = require('fs');
const path = require('path');
const util = require('util');
const any = require('promise.any');

const join = path.join;
const resolve = path.resolve;
const extname = path.extname;
const dirname = path.dirname;
const isAbsolute = path.isAbsolute;

let readCache = {};

/**
 * Require cache.
 */

let cacheStore = {};

/**
 * Require cache.
 */

const requires = {};

/**
 * Clear the cache.
 *
 * @api public
 */

exports.clearCache = function() {
  readCache = {};
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
  // cachable
  if (compiled && options.filename && options.cache) {
    delete readCache[options.filename];
    cacheStore[options.filename] = compiled;
    return compiled;
  }

  // check cache
  if (options.filename && options.cache) {
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
 * @param {Function} cb
 * @api private
 */

function read(path, options, cb) {
  var str = readCache[path];
  var cached = options.cache && str && typeof str === 'string';

  // cached (only if cached is a string and not a compiled template function)
  if (cached) return cb(null, str);

  // read
  fs.readFile(path, 'utf8', function(err, str) {
    if (err) return cb(err);
    // remove extraneous utf8 BOM marker
    str = str.replace(/^\uFEFF/, '');
    if (options.cache) readCache[path] = str;
    cb(null, str);
  });
}

/**
 * Read `path` with `options` with
 * callback `(err, str)`. When `options.cache`
 * is true the partial string will be cached.
 *
 * @param {String} options
 * @param {Function} fn
 * @api private
 */

function readPartials(path, options, cb) {
  if (!options.partials) return cb();
  var keys = Object.keys(options.partials);
  var partials = {};

  function next(index) {
    if (index === keys.length) return cb(null, partials);
    var key = keys[index];
    var partialPath = options.partials[key];

    if (
      partialPath === undefined ||
      partialPath === null ||
      partialPath === false
    ) {
      return next(++index);
    }

    var file;
    if (isAbsolute(partialPath)) {
      if (extname(partialPath) !== '') {
        file = partialPath;
      } else {
        file = join(partialPath + extname(path));
      }
    } else {
      file = join(dirname(path), partialPath + extname(path));
    }

    read(file, options, function(err, str) {
      if (err) return cb(err);
      partials[key] = str;
      next(++index);
    });
  }

  next(0);
}

/**
 * promisify
 */
function promisify(cb, fn) {
  return new Promise((resolve, reject) => {
    fn(cb || ((err, html) => (err ? reject(err) : resolve(html))));
  });
}

/**
 * use
 */
function use(dep, key = dep, opts) {
  if (typeof key === 'object') {
    opts = key;
    key = dep;
  }

  if (requires[key]) {
    return Promise.resolve(requires[key]);
  }

  return import(dep).then((engine) => {
    if (opts && opts.constructor) {
      const Constructor = engine.default;
      requires[key] = new Constructor(opts.constructorOptions);
      return requires[key];
    }

    requires[key] = engine.default;
    return requires[key];
  });
}

/**
 * useAny
 */
function useAny(deps, key, opts) {
  return any(deps.map((dep) => use(dep, key, opts)));
}

/**
 * fromStringRenderer
 */

function fromStringRenderer(name) {
  return function(path, options, cb) {
    options.filename = path;

    return promisify(cb, function(cb) {
      readPartials(path, options, function(err, partials) {
        var extend = util._extend;
        var opts = extend({}, options);
        opts.partials = partials;
        if (err) return cb(err);
        if (cache(opts)) {
          exports[name].render('', opts, cb);
        } else {
          read(path, opts, function(err, str) {
            if (err) return cb(err);
            exports[name].render(str, opts, cb);
          });
        }
      });
    });
  };
}

/**
 * velocity support.
 */

exports.velocityjs = fromStringRenderer('velocityjs');

/**
 * velocity string support.
 */

exports.velocityjs.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('velocityjs').then((engine) => {
      try {
        options.locals = options;
        cb(null, engine.render(str, options).trimLeft());
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Liquid support.
 */

exports.liquid = fromStringRenderer('liquid');

/**
 * Liquid string support.
 */

/**
 * Note that in order to get filters and custom tags we've had to push
 * all user-defined locals down into @locals. However, just to make things
 * backwards-compatible, any property of `options` that is left after
 * processing and removing `locals`, `meta`, `filters`, `customTags` and
 * `includeDir` will also become a local.
 */

function _renderTinyliquid(engine, str, options, cb) {
  var context = engine.newContext();
  var k;

  /**
   * Note that there's a bug in the library that doesn't allow us to pass
   * the locals to newContext(), hence looping through the keys:
   */

  if (options.locals) {
    for (k in options.locals) {
      context.setLocals(k, options.locals[k]);
    }
    delete options.locals;
  }

  if (options.meta) {
    context.setLocals('page', options.meta);
    delete options.meta;
  }

  /**
   * Add any defined filters:
   */

  if (options.filters) {
    for (k in options.filters) {
      context.setFilter(k, options.filters[k]);
    }
    delete options.filters;
  }

  /**
   * Set up a callback for the include directory:
   */

  var includeDir = options.includeDir || process.cwd();

  context.onInclude(function(name, callback) {
    var extname = path.extname(name) ? '' : '.liquid';
    var filename = path.resolve(includeDir, name + extname);

    fs.readFile(filename, { encoding: 'utf8' }, function(err, data) {
      if (err) return callback(err);
      callback(null, engine.parse(data));
    });
  });
  delete options.includeDir;

  /**
   * The custom tag functions need to have their results pushed back
   * through the parser, so set up a shim before calling the provided
   * callback:
   */

  var compileOptions = {
    customTags: {}
  };

  if (options.customTags) {
    var tagFunctions = options.customTags;

    for (k in options.customTags) {
      /*Tell jshint there's no problem with having this function in the loop */
      /*jshint -W083 */
      compileOptions.customTags[k] = function(context, name, body) {
        var tpl = tagFunctions[name](body.trim());
        context.astStack.push(engine.parse(tpl));
      };
      /*jshint +W083 */
    }
    delete options.customTags;
  }

  /**
   * Now anything left in `options` becomes a local:
   */

  for (k in options) {
    context.setLocals(k, options[k]);
  }

  /**
   * Finally, execute the template:
   */

  var tmpl =
    cache(context) || cache(context, engine.compile(str, compileOptions));
  tmpl(context, cb);
}

exports.liquid.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    useAny(['tinyliquid', 'liquid-node']).then(() => {
      if (requires.tinyliquid) {
        _renderTinyliquid(requires.tinyliquid, str, options, cb);
        return;
      }

      const Liquid = requires['liquid-node'];
      const engine = new Liquid.Engine();

      try {
        var locals = options.locals || {};

        if (options.meta) {
          locals.pages = options.meta;
          delete options.meta;
        }

        /**
       * Add any defined filters:
       */

        if (options.filters) {
          engine.registerFilters(options.filters);
          delete options.filters;
        }

        /**
       * Set up a callback for the include directory:
       */

        var includeDir = options.includeDir || process.cwd();
        engine.fileSystem = new Liquid.LocalFileSystem(includeDir, 'liquid');
        delete options.includeDir;

        /**
       * The custom tag functions need to have their results pushed back
       * through the parser, so set up a shim before calling the provided
       * callback:
       */

        if (options.customTags) {
          var tagFunctions = options.customTags;

          for (k in options.customTags) {
            engine.registerTag(k, tagFunctions[k]);
          }
          delete options.customTags;
        }

        /**
       * Now anything left in `options` becomes a local:
       */

        for (var k in options) {
          locals[k] = options[k];
        }

        /**
       * Finally, execute the template:
       */

        return engine.parseAndRender(str, locals).nodeify(function(err, result) {
          if (err) {
            throw new Error(err);
          } else {
            return cb(null, result);
          }
        });
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Jade support.
 */

exports.jade = function(path, options, cb) {
  return promisify(cb, function(cb) {
    useAny(['jade', 'then-jade'], 'jade').then((engine) => {
      try {
        var tmpl =
          cache(options) || cache(options, engine.compileFile(path, options));
        cb(null, tmpl(options));
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Jade string support.
 */

exports.jade.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    useAny(['jade', 'then-jade'], 'jade').then((engine) => {
      try {
        var tmpl =
          cache(options) || cache(options, engine.compile(str, options));
        cb(null, tmpl(options));
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Dust support.
 */

exports.dust = fromStringRenderer('dust');

/**
 * Dust string support.
 */

exports.dust.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    useAny(['dust', 'dustjs-helpers', 'dustjs-linkedin'], 'dust').then(
      (engine) => {
        var ext = 'dust';
        var views = '.';

        if (options) {
          if (options.ext) ext = options.ext;
          if (options.views) views = options.views;
          if (options.settings && options.settings.views) {
            views = options.settings.views;
          }
        }
        if (!options || (options && !options.cache)) engine.cache = {};

        engine.onLoad = function(path, callback) {
          if (extname(path) === '') path += '.' + ext;
          if (path[0] !== '/') path = views + '/' + path;
          read(path, options, callback);
        };

        try {
          var templateName;
          if (options.filename) {
            templateName = options.filename
              .replace(new RegExp('^' + views + '/'), '')
              .replace(new RegExp('\\.' + ext), '');
          }

          var tmpl =
            cache(options) ||
            cache(options, engine.compileFn(str, templateName));
          tmpl(options, cb);
        } catch (err) {
          cb(err);
        }
      }
    );
  });
};

/**
 * Swig support.
 */

exports.swig = fromStringRenderer('swig');

/**
 * Swig string support.
 */

exports.swig.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    useAny(['swig', 'swig-templates'], 'swig').then((engine) => {
      try {
        if (options.cache === true) options.cache = 'memory';
        engine.setDefaults({ cache: options.cache });
        var tmpl =
          cache(options) || cache(options, engine.compile(str, options));
        cb(null, tmpl(options));
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Razor support.
 */

exports.razor = function(path, options, cb) {
  return promisify(cb, function(cb) {
    use('razor-tmpl', 'razor').then((engine) => {
      try {
        var tmpl =
          cache(options) ||
          cache(options, (locals) => {
            console.log('Rendering razor file', path);
            return engine.renderFileSync(path, locals);
          });
        cb(null, tmpl(options));
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * razor string support.
 */

exports.razor.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('razor-tmpl', 'razor').then((engine) => {
      try {
        var tf = engine.compile(str);
        var tmpl = cache(options) || cache(options, tf);
        cb(null, tmpl(options));
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Atpl support.
 */

exports.atpl = fromStringRenderer('atpl');

/**
 * Atpl string support.
 */

exports.atpl.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('atpl').then((engine) => {
      try {
        var tmpl =
          cache(options) || cache(options, engine.compile(str, options));
        cb(null, tmpl(options));
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Liquor support,
 */

exports.liquor = fromStringRenderer('liquor');

/**
 * Liquor string support.
 */

exports.liquor.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('liquor').then((engine) => {
      try {
        var tmpl =
          cache(options) || cache(options, engine.compile(str, options));
        cb(null, tmpl(options));
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Twig support.
 */

exports.twig = fromStringRenderer('twig');

/**
 * Twig string support.
 */

exports.twig.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('twig').then((lib) => {
      const engine = lib.twig;
      const templateData = {
        data: str,
        allowInlineIncludes: options.allowInlineIncludes,
        namespaces: options.namespaces,
        path: options.path
      };
      try {
        const tmpl =
          cache(templateData) || cache(templateData, engine(templateData));
        cb(null, tmpl.render(options));
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * EJS support.
 */

exports.ejs = fromStringRenderer('ejs');

/**
 * EJS string support.
 */

exports.ejs.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('ejs').then((engine) => {
      try {
        var tmpl =
          cache(options) || cache(options, engine.compile(str, options));
        cb(null, tmpl(options));
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Eco support.
 */

exports.eco = fromStringRenderer('eco');

/**
 * Eco string support.
 */

exports.eco.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('eco').then((engine) => {
      try {
        cb(null, engine.render(str, options));
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Jazz support.
 */

exports.jazz = fromStringRenderer('jazz');

/**
 * Jazz string support.
 */

exports.jazz.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('jazz').then((engine) => {
      try {
        var tmpl =
          cache(options) || cache(options, engine.compile(str, options));
        tmpl.eval(options, function(str) {
          cb(null, str);
        });
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * JQTPL support.
 */

exports.jqtpl = fromStringRenderer('jqtpl');

/**
 * JQTPL string support.
 */

exports.jqtpl.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('jqtpl').then((engine) => {
      try {
        engine.template(str, str);
        cb(null, engine.tmpl(str, options));
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Haml support.
 */

exports.haml = fromStringRenderer('haml');

/**
 * Haml string support.
 */

exports.haml.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('hamljs', 'haml').then((engine) => {
      try {
        options.locals = options;
        cb(null, engine.render(str, options).trimLeft());
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Hamlet support.
 */

exports.hamlet = fromStringRenderer('hamlet');

/**
 * Hamlet string support.
 */

exports.hamlet.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('hamlet').then((engine) => {
      try {
        options.locals = options;
        cb(null, engine.render(str, options).trimLeft());
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Whiskers support.
 */

exports.whiskers = function(path, options, cb) {
  return promisify(cb, function(cb) {
    use('whiskers').then((engine) => {
      engine.__express(path, options, cb);
    });
  });
};

/**
 * Whiskers string support.
 */

exports.whiskers.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('whiskers').then((engine) => {
      try {
        cb(null, engine.render(str, options));
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Coffee-HAML support.
 */

exports['haml-coffee'] = fromStringRenderer('haml-coffee');

/**
 * Coffee-HAML string support.
 */

exports['haml-coffee'].render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('haml-coffee').then((engine) => {
      try {
        var tmpl =
          cache(options) || cache(options, engine.compile(str, options));
        cb(null, tmpl(options));
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Hogan support.
 */

exports.hogan = fromStringRenderer('hogan');

/**
 * Hogan string support.
 */

exports.hogan.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('hogan.js', 'hogan').then((engine) => {
      try {
        var tmpl =
          cache(options) || cache(options, engine.compile(str, options));
        cb(null, tmpl.render(options, options.partials));
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * templayed.js support.
 */

exports.templayed = fromStringRenderer('templayed');

/**
 * templayed.js string support.
 */

exports.templayed.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('templayed').then((engine) => {
      try {
        var tmpl = cache(options) || cache(options, engine(str));
        cb(null, tmpl(options));
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Handlebars support.
 */

exports.handlebars = fromStringRenderer('handlebars');

/**
 * Handlebars string support.
 */

exports.handlebars.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('handlebars').then((engine) => {
      try {
        for (var partial in options.partials) {
          engine.registerPartial(partial, options.partials[partial]);
        }
        for (var helper in options.helpers) {
          engine.registerHelper(helper, options.helpers[helper]);
        }
        var tmpl =
          cache(options) || cache(options, engine.compile(str, options));
        cb(null, tmpl(options));
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Underscore support.
 */

exports.underscore = fromStringRenderer('underscore');

/**
 * Underscore string support.
 */

exports.underscore.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('underscore').then((engine) => {
      try {
        const partials = {};
        for (var partial in options.partials) {
          partials[partial] = engine.template(options.partials[partial]);
        }
        options.partials = partials;
        var tmpl =
          cache(options) || cache(options, engine.template(str, null, options));
        cb(null, tmpl(options).replace(/\n$/, ''));
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Lodash support.
 */

exports.lodash = fromStringRenderer('lodash');

/**
 * Lodash string support.
 */

exports.lodash.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('lodash').then((engine) => {
      try {
        var tmpl =
          cache(options) || cache(options, engine.template(str, options));
        cb(null, tmpl(options).replace(/\n$/, ''));
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Pug support. (formerly Jade)
 */

exports.pug = function(path, options, cb) {
  return promisify(cb, function(cb) {
    useAny(['pug', 'then-pug'], 'pug').then((engine) => {
      try {
        var tmpl =
          cache(options) || cache(options, engine.compileFile(path, options));
        cb(null, tmpl(options));
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Pug string support.
 */

exports.pug.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    useAny(['pug', 'then-pug'], 'pug').then((engine) => {
      try {
        var tmpl =
          cache(options) || cache(options, engine.compile(str, options));
        cb(null, tmpl(options));
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * QEJS support.
 */

exports.qejs = fromStringRenderer('qejs');

/**
 * QEJS string support.
 */

exports.qejs.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('qejs').then((engine) => {
      try {
        engine
          .render(str, options)
          .then(
            function(result) {
              cb(null, result);
            },
            function(err) {
              cb(err);
            }
          )
          .done();
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Walrus support.
 */

exports.walrus = fromStringRenderer('walrus');

/**
 * Walrus string support.
 */

exports.walrus.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('walrus').then((engine) => {
      try {
        var tmpl = cache(options) || cache(options, engine.parse(str));
        cb(null, tmpl.compile(options));
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Mustache support.
 */

exports.mustache = fromStringRenderer('mustache');

/**
 * Mustache string support.
 */

exports.mustache.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('mustache').then((engine) => {
      try {
        cb(null, engine.render(str, options, options.partials));
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Just support.
 */

exports.just = function(path, options, cb) {
  return promisify(cb, function(cb) {
    use('just', { constructor: true }).then((engine) => {
      engine.configure({ useCache: options.cache });
      engine.render(path, options, cb);
    });
  });
};

/**
 * Just string support.
 */

exports.just.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('just', 'just-render').then(JUST => {
      const engine = new JUST({ root: { page: str } });
      engine.render('page', options, cb);
    });
  });
};

/**
 * ECT support.
 */

exports.ect = function(path, options, cb) {
  return promisify(cb, function(cb) {
    use('ect', { constructor: true, constructorOptions: options }).then(
      (engine) => {
        engine.configure({ cache: options.cache });
        engine.render(path, options, cb);
      }
    );
  });
};

/**
 * ECT string support.
 */

exports.ect.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('ect', 'ect-render').then(ECT => {
      const engine = new ECT({ root: { page: str } });
      engine.render('page', options, cb);
    });
  });
};

/**
 * mote support.
 */

exports.mote = fromStringRenderer('mote');

/**
 * mote string support.
 */

exports.mote.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('mote').then((engine) => {
      try {
        var tmpl = cache(options) || cache(options, engine.compile(str));
        cb(null, tmpl(options));
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Toffee support.
 */

exports.toffee = function(path, options, cb) {
  return promisify(cb, function(cb) {
    use('toffee').then((engine) => {
      engine.__consolidate_engine_render(path, options, cb);
    });
  });
};

/**
 * Toffee string support.
 */

exports.toffee.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('toffee').then((engine) => {
      try {
        engine.str_render(str, options, cb);
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * doT support.
 */

exports.dot = fromStringRenderer('dot');

/**
 * doT string support.
 */

exports.dot.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('dot').then((engine) => {
      const extend = util._extend;
      try {
        var settings = {};
        settings = extend(settings, engine.templateSettings);
        settings = extend(settings, options ? options.dot : {});
        var tmpl =
          cache(options) ||
          cache(options, engine.template(str, settings, options));
        cb(null, tmpl(options));
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * bracket support.
 */

exports.bracket = fromStringRenderer('bracket');

/**
 * bracket string support.
 */

exports.bracket.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('bracket-template', 'bracket').then((engine) => {
      try {
        var tmpl =
          cache(options) ||
          cache(options, engine.default.compile(str, options));
        cb(null, tmpl(options));
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Ractive support.
 */

exports.ractive = fromStringRenderer('ractive');

/**
 * Ractive string support.
 */

exports.ractive.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('ractive').then((Engine) => {
      var template = cache(options) || cache(options, Engine.parse(str));
      options.template = template;

      if (options.data === null || options.data === undefined) {
        const extend = util._extend;

        // Shallow clone the options object
        options.data = extend({}, options);

        // Remove consolidate-specific properties from the clone
        var i;
        var length;
        var properties = ['template', 'filename', 'cache', 'partials'];
        for (i = 0, length = properties.length; i < length; i++) {
          var property = properties[i];
          delete options.data[property];
        }
      }

      try {
        cb(null, new Engine(options).toHTML());
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Nunjucks support.
 */

exports.nunjucks = fromStringRenderer('nunjucks');

/**
 * Nunjucks string support.
 */

exports.nunjucks.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('nunjucks').then((lib) => {
      const engine = options.nunjucksEnv || lib;
      try {
        var env = engine;

        // deprecated fallback support for express
        // <https://github.com/tj/consolidate.js/pull/152>
        // <https://github.com/tj/consolidate.js/pull/224>
        if (options.settings && options.settings.views) {
          env = engine.configure(options.settings.views);
        } else if (options.nunjucks && options.nunjucks.configure) {
          env = engine.configure.apply(engine, options.nunjucks.configure);
        }

        //
        // because `renderString` does not initiate loaders
        // we must manually create a loader for it based off
        // either `options.settings.views` or `options.nunjucks` or `options.nunjucks.root`
        //
        // <https://github.com/mozilla/nunjucks/issues/730>
        // <https://github.com/crocodilejs/node-email-templates/issues/182>
        //

        // so instead we simply check if we passed a custom loader
        // otherwise we create a simple file based loader
        if (options.loader) {
          env = new engine.Environment(options.loader);
        } else if (options.settings && options.settings.views) {
          env = new engine.Environment(
            new engine.FileSystemLoader(options.settings.views)
          );
        } else if (options.nunjucks && options.nunjucks.loader) {
          if (typeof options.nunjucks.loader === 'string') {
            env = new engine.Environment(
              new engine.FileSystemLoader(options.nunjucks.loader)
            );
          } else {
            env = new engine.Environment(
              new engine.FileSystemLoader(
                options.nunjucks.loader[0],
                options.nunjucks.loader[1]
              )
            );
          }
        }

        env.renderString(str, options, cb);
      } catch (err) {
        throw cb(err);
      }
    });
  });
};

/**
 * HTMLing support.
 */

exports.htmling = fromStringRenderer('htmling');

/**
 * HTMLing string support.
 */

exports.htmling.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('htmling').then((engine) => {
      try {
        var tmpl = cache(options) || cache(options, engine.string(str));
        cb(null, tmpl.render(options));
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 *  Rendering function
 */
function requireReact(module, filename) {
  let babel;
  try {
    babel = requires.babel || (requires.babel = require('babel-core'));
  } catch {}

  var compiled = babel.transformFileSync(filename, { presets: ['react'] }).code;

  return module._compile(compiled, filename);
}

exports.requireReact = requireReact;

/**
 *  Converting a string into a node module.
 */
function requireReactString(src, filename) {
  let babel;
  try {
    babel = requires.babel || (requires.babel = require('babel-core'));
  } catch {}

  if (!filename) filename = '';
  var m = new module.constructor();
  filename = filename || '';

  // Compile Using React
  var compiled = babel.transform(src, { presets: ['react'] }).code;

  // Compile as a module
  m.paths = module.paths;
  m._compile(compiled, filename);

  return m.exports;
}

/**
 * A naive helper to replace {{tags}} with options.tags content
 */
function reactBaseTmpl(data, options) {
  var exp;
  var regex;

  // Iterates through the keys in file object
  // and interpolate / replace {{key}} with it's value
  for (var k in options) {
    if (options.hasOwnProperty(k)) {
      exp = '{{' + k + '}}';
      regex = new RegExp(exp, 'g');
      if (data.match(regex)) {
        data = data.replace(regex, options[k]);
      }
    }
  }

  return data;
}

/**
 * Plates Support.
 */

exports.plates = fromStringRenderer('plates');

/**
 * Plates string support.
 */

exports.plates.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('plates').then(engine => {
      var map = options.map || undefined;
      try {
        var tmpl = engine.bind(str, options, map);
        cb(null, tmpl);
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 *  The main render parser for React bsaed templates
 */
function reactRenderer(type) {
  if (require.extensions) {
    // Ensure JSX is transformed on require
    if (!require.extensions['.jsx']) {
      require.extensions['.jsx'] = requireReact;
    }

    // Supporting .react extension as well as test cases
    // Using .react extension is not recommended.
    if (!require.extensions['.react']) {
      require.extensions['.react'] = requireReact;
    }
  }

  // Return rendering fx
  return function(str, options, cb) {
    return promisify(cb, function(cb) {
      Promise.all([use('react'), use('react-dom/server.js', 'ReactDOM')]).then(
        ([react, ReactDOM]) => {
          // Assign HTML Base
          var base = options.base;
          delete options.base;

          var enableCache = options.cache;
          delete options.cache;

          var isNonStatic = options.isNonStatic;
          delete options.isNonStatic;

          // Start Conversion
          try {
            var Code;
            var Factory;

            var baseStr;
            var content;
            var parsed;

            if (!cache(options)) {
              // Parsing
              if (type === 'path') {
                var path = resolve(str);
                delete require.cache[path];
                Code = require(path);
              } else {
                Code = requireReactString(str);
              }
              Factory = cache(options, react.createFactory(Code));
            } else {
              Factory = cache(options);
            }

            parsed = new Factory(options);
            content = isNonStatic
              ? ReactDOM.renderToString(parsed)
              : ReactDOM.renderToStaticMarkup(parsed);

            if (base) {
              baseStr =
                readCache[str] || fs.readFileSync(resolve(base), 'utf8');

              if (enableCache) {
                readCache[str] = baseStr;
              }

              options.content = content;
              content = reactBaseTmpl(baseStr, options);
            }

            cb(null, content);
          } catch (err) {
            cb(err);
          }
        }
      );
    });
  };
}

/**
 * React JS Support
 */
exports.react = reactRenderer('path');

/**
 * React JS string support.
 */
exports.react.render = reactRenderer('string');

/**
 * ARC-templates support.
 */

exports['arc-templates'] = fromStringRenderer('arc-templates');

/**
 * ARC-templates string support.
 */

exports['arc-templates'].render = function(str, options, cb) {
  var readFileWithOptions = util.promisify(read);
  var consolidateFileSystem = {};
  consolidateFileSystem.readFile = function(path) {
    return readFileWithOptions(path, options);
  };

  return promisify(cb, function(cb) {
    use('arc-templates/dist/es5/index.js', 'arc-templates', {
      constructor: true,
      constructorOptions: {
        filesystem: consolidateFileSystem
      }
    }).then((engine) => {
      try {
        var compiler =
          cache(options) ||
          cache(options, engine.compileString(str, options.filename));
        compiler
          .then(function(func) {
            return func(options);
          })
          .then(function(result) {
            cb(null, result.content);
          })
          .catch(cb);
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Vash support
 */
exports.vash = fromStringRenderer('vash');

/**
 * Vash string support
 */
exports.vash.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('vash').then(engine => {
      try {
        // helper system : https://github.com/kirbysayshi/vash#helper-system
        if (options.helpers) {
          for (var key in options.helpers) {
            if (
              !options.helpers.hasOwnProperty(key) ||
              typeof options.helpers[key] !== 'function'
            ) {
              continue;
            }
            engine.helpers[key] = options.helpers[key];
          }
        }

        var tmpl = cache(options) || cache(options, engine.compile(str, options));
        tmpl(options, function sealLayout(err, ctx) {
          if (err) cb(err);
          ctx.finishLayout();
          cb(null, ctx.toString().replace(/\n$/, ''));
        });
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Slm support.
 */

exports.slm = fromStringRenderer('slm');

/**
 * Slm string support.
 */

exports.slm.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('slm').then(engine => {
      try {
        var tmpl = cache(options) || cache(options, engine.compile(str, options));
        cb(null, tmpl(options));
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Marko support.
 */

exports.marko = function(path, options, cb) {
  return promisify(cb, function(cb) {
    use('marko').then(engine => {
      options.writeToDisk = !!options.cache;

      try {
        var tmpl = cache(options) || cache(options, engine.load(path, options));
        tmpl.renderToString(options, cb);
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Marko string support.
 */

exports.marko.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('marko').then(engine => {
      options.writeToDisk = !!options.cache;
      options.filename = options.filename || 'string.marko';

      try {
        var tmpl =
          cache(options) ||
          cache(options, engine.load(options.filename, str, options));
        tmpl.renderToString(options, cb);
      } catch (err) {
        cb(err);
      }
    });
  });
};

/**
 * Teacup support.
 */
exports.teacup = function(path, options, cb) {
  return promisify(cb, function(cb) {
    use('teacup/lib/express.js', 'teacup').then(engine => {
      require.extensions['.teacup'] = require.extensions['.coffee'];
      if (path[0] !== '/') {
        path = join(process.cwd(), path);
      }
      if (!options.cache) {
        var callback = cb;
        cb = function() {
          delete require.cache[path];
          callback.apply(this, arguments);
        };
      }
      engine.renderFile(path, options, cb);
    });
  });
};

/**
 * Teacup string support.
 */
exports.teacup.render = function(str, options, cb) {
  var sandbox = { module: { exports: {} }, require };
  return promisify(cb, function(cb) {
    Promise.all([
      use('coffee-script'),
      use('vm')
    ]).then(([coffee, vm]) => {
      vm.runInNewContext(coffee.compile(str), sandbox);
      var tmpl = sandbox.module.exports;
      cb(null, tmpl(options));
    });
  });
};

/**
 * Squirrelly support.
 */

exports.squirrelly = fromStringRenderer('squirrelly');

/**
 * Squirrelly string support.
 */

exports.squirrelly.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('squirrelly').then(engine => {
      try {
        for (var partial in options.partials) {
          engine.definePartial(partial, options.partials[partial]);
        }
        for (var helper in options.helpers) {
          engine.defineHelper(helper, options.helpers[helper]);
        }
        var tmpl = cache(options) || cache(options, engine.Compile(str, options));
        cb(null, tmpl(options, engine));
      } catch (err) {
        cb(err);
      }
    });
  });
};
/**
 * Twing support.
 */

exports.twing = fromStringRenderer('twing');

/**
 * Twing string support.
 */

exports.twing.render = function(str, options, cb) {
  return promisify(cb, function(cb) {
    use('twing').then(engine => {
      try {
        new engine.TwingEnvironment(new engine.TwingLoaderNull())
          .createTemplate(str)
          .then((twingTemplate) => {
            twingTemplate.render(options).then((rendTmpl) => {
              var tmpl = cache(options) || cache(options, rendTmpl);
              cb(null, tmpl);
            });
          });
      } catch (err) {
        cb(err);
      }
    });
  });
};
/**
 * expose the instance of the engine
 */
exports.requires = requires;
