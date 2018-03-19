/*eslint-env node, mocha */
/*eslint  quotes: [2, "single"] */
var consolidate = require('../../');
var fs = require('fs');

var readFile = fs.readFile;
var readFileSync = fs.readFileSync;

exports.test = function(name) {
  'use strict';

  var user = { name: 'Tobi' };
  var cons;

  describe(name, function() {

    beforeEach(function() {
      cons = consolidate;
      fs.readFile = readFile;
      fs.readFileSync = readFileSync;
    });

    it('should support locals', function(done) {
      var path = 'test/fixtures/' + name + '/user.' + name;
      var locals = { user: user };
      cons[name](path, locals, function(err, html) {

        if (err) {
          return done(err);
        }

        html.should.equal('<p>Tobi</p>');
        done();
      });
    });

    it('should support promises', function(done) {
      var path = 'test/fixtures/' + name + '/user.' + name;
      var locals = { user: user };
      cons[name](path, locals)
        .then(function(html) {
          html.should.equal('<p>Tobi</p>');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should support rendering a string', function(done) {
      var str = fs.readFileSync('test/fixtures/' + name + '/user.' + name).toString();
      var locals = { user: user };

      cons[name].render(str, locals, function(err, html) {

        if (err) {
          return done(err);
        }

        html.should.equal('<p>Tobi</p>');
        done();
      });
    });

    it('should support promises from a string', function(done) {
      var str = fs.readFileSync('test/fixtures/' + name + '/user.' + name).toString();
      var locals = { user: user };

      cons[name].render(str, locals)
        .then(function(html) {
          html.should.equal('<p>Tobi</p>');
          done();
        })
        .catch(function(err) {
          return done(err);
        });
    });

    it('should support rendering into a base template', function(done) {
      var path = 'test/fixtures/' + name + '/user.' + name;
      var locals = {
        user: user,
        base: 'test/fixtures/' + name + '/base.html',
        title: 'My Title'
      };

      cons[name](path, locals, function(err, html) {

        if (err) {
          return done(err);
        }

        html.should.equal('<html><head><title>My Title</title></head><body><p>Tobi</p></body></html>');
        done();
      });
    });

  });
};
