
var cons = require('../../')
  , fs = require('fs')
  , readFile = fs.readFile
  , readFileSync = fs.readFileSync;

exports.test = function(name) {
  var user = { name: 'Tobi' };

  describe(name, function(){
    afterEach(function(){
      fs.readFile = readFile;
      fs.readFileSync = readFileSync;
    });

    if (name == 'hogan' || name == 'mustache' || name == 'handlebars') {
      it('should support partials', function(done){
        var path = 'test/fixtures/' + name + '/partials.' + name;
        var locals = { user: user, partials: { partial: 'user' } };
        cons[name](path, locals, function(err, html){
          if (err) return done(err);
          html.should.equal('<p>Tobi</p>');
          done();
        });
      });
      it('should support cached partials', function(done){
        var path = 'test/fixtures/' + name + '/partials.' + name;
        var locals = { user: user, cache: true, partials: { partial: 'user' } };
        cons[name](path, locals, function(err, html){
          if (err) return done(err);
          fs.readFile = function(path){
            done(new Error('fs.readFile() called with ' + path));
          };
          html.should.equal('<p>Tobi</p>');
          locals = { user: user, cache: true, partials: { partial: 'user' } };
          cons[name](path, locals, function(err, html){
            if (err) return done(err);
            html.should.equal('<p>Tobi</p>');
            done();
          });
        });
      });
      it('should support rendering a partial from string', function(done){
        var str = fs.readFileSync('test/fixtures/' + name + '/partials.' + name).toString();
        var partialStr = fs.readFileSync('test/fixtures/' + name + '/user.' + name).toString();
        var locals = { user: user, partials: { partial: partialStr } };
        cons[name].render(str, locals, function(err, html){
          if (err) return done(err);
          html.should.equal('<p>Tobi</p>');
          done();
        });
      });
    }
    if (name == 'dust') {
      it('should support rendering a partial', function(done){
        var str = fs.readFileSync('test/fixtures/' + name + '/user_partial.' + name).toString();
        var locals = { 
          user: user,
          views: "./test/fixtures/" + name
        };
        cons[name].render(str, locals, function(err, html){
          if (err) return done(err);
          html.should.equal('<p>Tobi from partial!</p><p>Tobi</p>');
          done();
        });
      });
    }
  });
};
