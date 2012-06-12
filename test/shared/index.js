
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
    })

    it('should support locals', function(done){
      var path = 'test/fixtures/' + name + '/user.' + name;
      var locals = { user: user };
      cons[name](path, locals, function(err, html){
        if (err) return done(err);
        html.should.equal('<p>Tobi</p>');
        done();
      });
    })

    it('should not cache by default', function(done){
      var path = 'test/fixtures/' + name + '/user.' + name;
      var locals = { user: user };
      var calls = 0;

      fs.readFileSync = function(){
        ++calls;
        return readFileSync.apply(this, arguments);
      };

      fs.readFile = function(){
        ++calls;
        return readFile.apply(this, arguments);
      };

      cons[name](path, locals, function(err, html){
        if (err) return done(err);
        html.should.equal('<p>Tobi</p>');
        cons[name](path, locals, function(err, html){
          if (err) return done(err);
          html.should.equal('<p>Tobi</p>');
          calls.should.equal(2);
          done();
        });
      });
    })

    it('should support caching', function(done){
      var path = 'test/fixtures/' + name + '/user.' + name;
      var locals = { user: user, cache: true };

      cons[name](path, locals, function(err, html){
        if (err) return done(err);

        fs.readFileSync = function(path){
          done(new Error('fs.readFileSync() called with ' + path));
        }

        fs.readFile = function(path){
          done(new Error('fs.readFile() called with ' + path));
        };

        html.should.equal('<p>Tobi</p>');
        cons[name](path, locals, function(err, html){
          if (err) return done(err);
          html.should.equal('<p>Tobi</p>');
          done();
        });
      });
    })

    //Engine specific tests
    try{
      require('../engine/' + name);
    }
    catch(err){};
  })
};
