
var cons = require('../../');
var join = require('path').join;
var fs = require('fs');
var readFile = fs.readFile;
var readFileSync = fs.readFileSync;

exports.test = function(name) {
  var user = { name: 'Tobi' };

  describe(name, function() {
    afterEach(function() {
      fs.readFile = readFile;
      fs.readFileSync = readFileSync;
    });

    if (name === 'dust' || name === 'arc-templates') {
      it('should support rendering a partial', function(done) {
        var str = fs.readFileSync('test/fixtures/' + name + '/user_partial.' + name).toString();
        var locals = {
          user: user,
          views: './test/fixtures/' + name
        };
        cons[name].render(str, locals, function(err, html) {
          if (err) return done(err);
          html.should.equal('<p>Tobi from partial!</p><p>Tobi</p>');
          done();
        });
      });
    } else {
      it('should support partials', function(done) {
        var path = 'test/fixtures/' + name + '/partials.' + name;
        var locals = { user: user, partials: { partial: 'user' } };
        cons[name](path, locals, function(err, html) {
          if (err) return done(err);
          html.should.equal('<p>Tobi</p>');
          done();
        });
      });
      it('should support absolute path partial', function(done) {
        var path = 'test/fixtures/' + name + '/partials.' + name;
        var locals = {user: user, partials: {partial: join(__dirname, '/../../test/fixtures/', name, '/user') }};
        cons[name](path, locals, function(err, html) {
          if (err) return done(err);
          html.should.equal('<p>Tobi</p>');
          done();
        });
      });
      it('should support relative path partial', function(done) {
        var path = 'test/fixtures/' + name + '/partials.' + name;
        var locals = {user: user, partials: {partial: '../' + name + '/user' }};
        cons[name](path, locals, function(err, html) {
          if (err) return done(err);
          html.should.equal('<p>Tobi</p>');
          done();
        });
      });
    }
  });
};
