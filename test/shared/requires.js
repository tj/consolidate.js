
var consolidate = require('../../')
  , fs = require('fs')
  , readFile = fs.readFile
  , readFileSync = fs.readFileSync;  

var cons = consolidate;
require.extensions['.react'] = cons.reactTransform;

exports.test = function(name) {
  var user = { name: 'Tobi' };

  describe(name, function(){

    beforeEach(function(){
      fs.readFile = readFile;
      fs.readFileSync = readFileSync;
    });

    it('should support locals', function(done){
      var path = 'test/fixtures/' + name + '/user.' + name;
      var locals = { user: user };
      cons[name](path, locals, function(err, html){
        if (err) return done(err);
        html.should.equal('<p>Tobi</p>');
        done();
      });
    });


    it('should support rendering a string', function(done){
      var str = fs.readFileSync('test/fixtures/' + name + '/user.' + name).toString();
      var locals = { user: user };
      cons[name].render(str, locals, function(err, html){
        if (err) return done(err);
        html.should.equal('<p>Tobi</p>');
        done();
      });
    });
  });
};
