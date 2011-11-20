
var cons = require('../');

var user = { name: 'Tobi' };

describe('jade', function(){
  it('should render', function(done){
    var path = 'test/fixtures/jade/user.jade';
    var locals = { user: user };
    cons.render.jade(path, locals, function(err, html){
      if (err) return done(err);
      html.should.equal('<p>Tobi</p>');
      done();
    });
  })
})
