
var cons = require('../../');

exports.test = function(name) {
  var user = { name: 'Tobi' };

  describe(name, function(){
    it('should support locals', function(done){
      var path = 'test/fixtures/' + name + '/user.' + name;
      var locals = { user: user };
      cons.render.jade(path, locals, function(err, html){
        if (err) return done(err);
        html.should.equal('<p>Tobi</p>');
        done();
      });
    })
  })
};