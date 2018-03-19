var cons = require('../../');
var fs = require('fs');

exports.test = function(name) {
  var user = { name: 'Tobi' };

  describe(name, function() {

    it('should support includes', function(done) {
      var str = fs.readFileSync('test/fixtures/' + name + '/include.' + name).toString();

      var viewsDir = 'test/fixtures/' + name;
      var locals = { user: user, settings: { views: viewsDir } };

      if (name === 'liquid' || name === 'arc-templates') {
        locals.includeDir = viewsDir;
      }

      cons[name].render(str, locals, function(err, html) {
        if (err) return done(err);
        try {
          if (name === 'liquid') {
            html.should.eql('<p>Tobi</p><section></section><footer></footer>');
          } else {
            html.should.eql('<p>Tobi</p>');
          }
          return done();
        } catch (e) {
          return done(e);
        }
      });
    });

    if (name === 'nunjucks') {
      it('should support extending views', function(done) {
        var str = fs.readFileSync('test/fixtures/' + name + '/layouts.' + name).toString();

        var locals = {user: user, settings: {views: 'test/fixtures/' + name}};

        cons[name].render(str, locals, function(err, html) {
          if (err) return done(err);
          try {
            html.should.eql('<header></header><p>Tobi</p><footer></footer>');
            return done();
          } catch (e) {
            return done(e);
          }
        });
      });
    }
  });
};
