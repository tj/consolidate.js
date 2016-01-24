
var cons = require('../../')
  , handlebars = require('handlebars')
  , vash = require('vash')
  , fs = require('fs')
  , readFile = fs.readFile
  , readFileSync = fs.readFileSync;

exports.test = function(name) {

  describe(name, function(){

    afterEach(function(){
      fs.readFile = readFile;
      fs.readFileSync = readFileSync;
    });

    if (name === 'handlebars') {
        var user = { name: '<strong>Tobi</strong>' };

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

    if (name === 'vash') {
        var user = { name: 'Tobi' };

        // See this for Vash helper system : https://github.com/kirbysayshi/vash#helper-system
        // Use case: return as as lower case
        it('should support helpers', function(done) {
            var str = fs.readFileSync('test/fixtures/' + name + '/helpers.' + name).toString();

            var locals = { user: user, helpers: { lowerCase: function(text) {
                return text.toLowerCase();
            }}};

            cons[name].render(str, locals, function(err, html){
                if (err) return done(err);
                html.should.equal('<strong>tobi</strong>');
                done();
            });
        });
    }
  });
};
