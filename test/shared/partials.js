
var cons = require('../../')
  , fs = require('fs')
  , readFile = fs.readFile
  , readFileSync = fs.readFileSync
  , resolve = require('path').resolve;

exports.test = function(name) {
  var user = { name: 'Tobi' }
    , fixturePath = 'test/fixtures/' + name + '/';

  describe(name, function(){
    afterEach(function(){
      fs.readFile = readFile;
      fs.readFileSync = readFileSync;
    });

    it('should support rendering a partial', function(done){
      var str = fs.readFileSync(fixturePath + '/user_partial.' + name)
        .toString();

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

    it('should support a partial relative to parent view', function(done){
      var str = fs.readFileSync(fixturePath + '/relative/parent_view.' + name)
        .toString();

      var locals = {
        user: user,
        views: "./test/fixtures/" + name,
        filename: resolve(fixturePath + '/relative/parent_view.' + name)
      };

      cons[name].render(str, locals, function(err, html){
        if (err) return done(err);
        html.should.equal([
          '<p>Tobi from partial child view, relative path!</p>',
          '<p>Tobi is in the parent view.</p>'
        ].join(''));
        done();
      });
    });
  });
};
