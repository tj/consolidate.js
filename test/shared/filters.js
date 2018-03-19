var cons = require('../../');
var fs = require('fs');

exports.test = function(name) {
  var user = { name: 'Tobi' };

  describe(name, function() {

    // Use case: return upper case string.
    it('should support filters', function(done) {
      var str = fs.readFileSync('test/fixtures/' + name + '/filters.' + name).toString();

      var locals = { user: user,
        filters: { toupper: function(object) {
          return object.toUpperCase();
        }}};

      cons[name].render(str, locals, function(err, html) {
        if (err) return done(err);
        html.should.eql('TOBI');
        return done();
      });
    });
  });
};
