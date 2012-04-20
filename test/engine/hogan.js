var cons = require('../../');

var fs = require('fs')
  , readFile = fs.readFile
  , readFileSync = fs.readFileSync;

it('should support partials', function(done){
  var path = 'test/fixtures/hogan/layout.hogan';
  var locals = {
    partials : { body: 'test/fixtures/hogan/body.hogan' }
  }

  cons.hogan(path,locals,function(err,html){
    if(err) return done(err)

    html.should.equal('<div>layout</div><div>body</div>');
    done();
  });
});

it('should cache partials', function(done){
  var path = 'test/fixtures/hogan/layout.hogan';
  var locals = {
    cache: true,
    partials : { body: 'test/fixtures/hogan/body.hogan' }
  }

  cons.hogan(path,locals,function(err,html){
    if(err) return done(err)

    fs.readFileSync = function(path){
      done(new Error('fs.readFileSync() called with ' + path));
    }

    fs.readFile = function(path){
      done(new Error('fs.readFile() called with ' + path));
    };

    html.should.equal('<div>layout</div><div>body</div>');
    cons.hogan(path,locals, function(err,html){
      if(err) return done(err);
      html.should.equal('<div>layout</div><div>body</div>');
      done();
    });      
  });
});

it('should support hogan options', function(done){
  var path = 'test/fixtures/hogan/altDelimiters.hogan';
  var locals = {
    delimiters: '[[ ]]',
    user: {name:'tobi'}
  };

  cons.hogan(path,locals,function(err,html){
    if(err) return done(err);
    html.should.equal('<p>tobi</p>');
    done();
  });
});


it('should not alter the options', function(done){
  var path = 'test/fixtures/hogan/layout.hogan';
  var locals = {
    partials : { body: 'test/fixtures/hogan/body.hogan' }
  }

  cons.hogan(path,locals,function(err,html){
    if(err) return done(err);
    html.should.equal('<div>layout</div><div>body</div>');

    //If the locals object has been changed (ie -> partials overriden),
    //this 2nd render will most likely fail.
    cons.hogan(path,locals,function(err,html){
      if(err) return done(err);
      html.should.equal('<div>layout</div><div>body</div>');
      locals.partials.body.should.equal('test/fixtures/hogan/body.hogan');
      done();
    });
  });
});
