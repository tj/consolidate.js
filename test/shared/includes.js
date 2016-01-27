var cons = require('../../')
  , fs = require('fs');

var should = require('should');

exports.test = function(name) {
  var user = { name: 'Tobi' };

  describe(name, function(){

    it('should support includes', function(done) {
      var str = fs.readFileSync('test/fixtures/' + name + '/include.' + name).toString();
      var locals = { user: user, includeDir: 'test/fixtures/' + name };

      cons[name].render(str, locals, function(err, html){
        if (err) return done(err);
        try{
          if (name === 'liquid') {
            html.should.eql('<p>Tobi</p><section></section><footer></footer>');
          } else {
            html.should.eql('<p>Tobi</p>');
          }
          return done();
        } catch(e) {
          return done(e);
        }
      });
    });
  });
};
