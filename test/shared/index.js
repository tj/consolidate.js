
var cons = require('../../');
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

    it('should support locals', function(done) {
      var path = 'test/fixtures/' + name + '/user.' + name;
      var locals = { user: user };
      cons[name](path, locals, function(err, html) {
        if (err) return done(err);
        html.should.match(/Tobi/);
        done();
      });
    });

    it('should not cache by default', function(done) {
      var path = 'test/fixtures/' + name + '/user.' + name;
      var locals = { user: user };
      var calls = 0;

      fs.readFileSync = function() {
        ++calls;
        return readFileSync.apply(this, arguments);
      };

      fs.readFile = function() {
        ++calls;
        readFile.apply(this, arguments);
      };

      cons[name](path, locals, function(err, html) {
        if (err) return done(err);
        html.should.match(/Tobi/);
        cons[name](path, locals, function(err, html) {
          if (err) return done(err);
          html.should.match(/Tobi/);
          calls.should.equal(name === 'atpl' ? 4 : 2);
          done();
        });
      });
    });

    it('should support caching', function(done) {
      var path = 'test/fixtures/' + name + '/user.' + name;
      var locals = { user: user, cache: true };

      cons[name](path, locals, function(err, html) {
        if (err) return done(err);

        fs.readFile = function(path) {
          done(new Error('fs.readFile() called with ' + path));
        };

        html.should.match(/Tobi/);
        cons[name](path, locals, function(err, html) {
          if (err) return done(err);
          html.should.match(/Tobi/);
          done();
        });
      });
    });

    it('should support rendering a string', function(done) {
      var str = fs.readFileSync('test/fixtures/' + name + '/user.' + name).toString();
      var locals = { user: user };
      cons[name].render(str, locals, function(err, html) {
        if (err) return done(err);
        html.should.match(/Tobi/);
        done();
      });
    });

    it('should return a promise if no callback provided', function(done) {
      var path = 'test/fixtures/' + name + '/user.' + name;
      var locals = { user: user };
      var result = cons[name](path, locals);

      result.then(function(html) {
        html.should.match(/Tobi/);
        done();
      })
        .catch(function(err) {
          done(err);
        });
    });

    it('should return a promise if no callback provided (string)', function(done) {
      var str = fs.readFileSync('test/fixtures/' + name + '/user.' + name).toString();
      var locals = { user: user };
      var result = cons[name].render(str, locals);

      result.then(function(html) {
        html.should.match(/Tobi/);
        done();
      })
        .catch(function(err) {
          done(err);
        });
    });

    it('should be exposed in the requires object', function() {
      var should = require('should');
      var requiredName = name;
      should.exist(cons.requires[requiredName]);
    });
  });
};
