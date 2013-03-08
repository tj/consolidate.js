
var cons = require('../../')
  , handlebars = require('handlebars')
  , fs = require('fs')
  , readFile = fs.readFile
  , readFileSync = fs.readFileSync;

exports.test = function(name) {
  var user = { name: '<strong>Tobi</strong>' };

  describe(name, function(){

    afterEach(function(){
      fs.readFile = readFile;
      fs.readFileSync = readFileSync;
    });

    if (name == 'handlebars') {

      // Use case: return safe HTML that won’t be escaped in the final render.
      it('should support helpers', function(done) {
        var str = fs.readFileSync('test/fixtures/' + name + '/helpers.' + name).toString();

        var locals = { user: user, helpers: { safe: function(object) {
          return new handlebars.SafeString(object);
        }}};

        cons[name].render(str, locals, function(err, html){
          if (err) return done(err);
          html.should.equal('<strong>Tobi</strong>');
          done();
        });
      });
    }
  });
};