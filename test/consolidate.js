var cons = require('../');
var semver = require('semver');
/*eslint-env node*/
/*eslint  quotes: [2, "single"] */
require('./shared').test('jade');
require('./shared').test('pug');

// testing tinyliquid
cons.requires.liquid = require('tinyliquid');
require('./shared').test('liquid');
require('./shared/filters').test('liquid');
require('./shared/includes').test('liquid');

// testing liquid-node
cons.requires.liquid = require('liquid-node');
require('./shared').test('liquid');
require('./shared/filters').test('liquid');
require('./shared/includes').test('liquid');

require('./shared').test('ejs');
require('./shared').test('swig');
require('./shared').test('jazz');
require('./shared').test('jqtpl');
require('./shared').test('liquor');
require('./shared').test('haml');
require('./shared').test('hamlet');
require('./shared').test('eco');
require('./shared').test('whiskers');
require('./shared').test('haml-coffee');
require('./shared').test('hogan');
require('./shared/partials').test('hogan');
require('./shared').test('dust');
require('./shared/partials').test('dust');
require('./shared/dust').test('dust');
require('./shared').test('handlebars');
require('./shared/partials').test('handlebars');
require('./shared/helpers').test('handlebars');
require('./shared').test('underscore');
require('./shared/partials').test('underscore');
require('./shared').test('lodash');
require('./shared').test('qejs');
require('./shared').test('walrus');
require('./shared').test('mustache');
require('./shared/partials').test('mustache');
require('./shared').test('just');
require('./shared').test('ect');
require('./shared').test('mote');
require('./shared').test('toffee');
require('./shared').test('atpl');
require('./shared').test('plates');
require('./shared').test('templayed');
require('./shared').test('twig');
require('./shared').test('dot');
require('./shared').test('ractive');
require('./shared/partials').test('ractive');
require('./shared').test('nunjucks');
require('./shared/filters').test('nunjucks');
require('./shared/includes').test('nunjucks');
require('./shared').test('htmling');
require('./shared/react').test('react');
require('./shared').test('vash');
require('./shared/helpers').test('vash');
require('./shared').test('slm');
require('./shared').test('arc-templates');
require('./shared/filters').test('arc-templates');
require('./shared/includes').test('arc-templates');
require('./shared/partials').test('arc-templates');
require('./shared').test('marko');
require('./shared').test('bracket');
require('./shared').test('teacup');
require('./shared').test('velocityjs');
require('./shared').test('razor');
require('./shared').test('squirrelly');
require('./shared/partials').test('squirrelly');
require('./shared/helpers').test('squirrelly');
if (semver.satisfies(process.version, '>=8.0.0')) {
  require('./shared').test('twing');
}
