
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
  });
};
