
var cons = require('../../');
var handlebars = require('handlebars');
var Sqrl = require('squirrelly');
var fs = require('fs');
var readFile = fs.readFile;
var readFileSync = fs.readFileSync;

exports.test = function(name) {

  describe(name, function() {

    afterEach(function() {
      fs.readFile = readFile;
      fs.readFileSync = readFileSync;
    });

    var user;

    if (name === 'handlebars') {
      user = { name: '<strong>Tobi</strong>' };

      // Use case: return safe HTML that won’t be escaped in the final render.
      it('should support helpers', function(done) {
        var str = fs.readFileSync('test/fixtures/' + name + '/helpers.' + name).toString();

        var locals = { user: user,
          helpers: { safe: function(object) {
            return new handlebars.SafeString(object);
          }}};

        cons[name].render(str, locals, function(err, html) {
          if (err) return done(err);
          html.should.equal('<strong>Tobi</strong>');
          done();
        });
      });
    } else if (name === 'squirrelly') {
      user = { name: '<strong>Tobi</strong>' };

      // Use case: return safe HTML that won’t be escaped in the final render.
      it('should support helpers', function(done) {
        var str = fs.readFileSync('test/fixtures/' + name + '/helpers.' + name).toString();
        Sqrl.defineHelper('myhelper', function(args, content, blocks) {
          return args[0].slice(1, -1);
        });
        var options = { user: user };

        cons[name].render(str, options, function(err, html) {
          if (err) return done(err);
          html.should.equal('strong>Tobi</strong');
          done();
        });
      });
    }

    if (name === 'vash') {
      user = { name: 'Tobi' };

      // See this for Vash helper system : https://github.com/kirbysayshi/vash#helper-system
      // Use case: return as as lower case
      it('should support helpers', function(done) {
        var str = fs.readFileSync('test/fixtures/' + name + '/helpers.' + name).toString();

        var locals = { user: user,
          helpers: { lowerCase: function(text) {
            return text.toLowerCase();
          }}};

        cons[name].render(str, locals, function(err, html) {
          if (err) return done(err);
          html.should.equal('<strong>tobi</strong>');
          done();
        });
      });
    }
  });
};
