/*eslint-env node, mocha */
var cons = require('../../');
var fs = require('fs');

// var should = require('should');

exports.test = function(name) {
  var user = { name: 'Tobi' };

  describe(name, function() {
    // Use case: return upper case string.
    it('should support fetching template name from the context', function(done) {
      var viewsDir = 'test/fixtures/' + name;
      var templatePath = viewsDir + '/user_template_name.' + name;
      var str = fs.readFileSync(templatePath).toString();

      var locals = {
        user: user,
        views: viewsDir,
        filename: templatePath
      };

      if (name === 'dust') {
        var dust = require('dustjs-helpers');
        dust.helpers.templateName = function(chunk, context) {
          return chunk.write(context.getTemplateName());
        };
        cons.requires.dust = dust;
      }

      cons[name].render(str, locals, function(err, html) {
        if (err) return done(err);
        html.should.eql('<p>Tobi</p>user_template_name');
        return done();
      });
    });
  });
};
