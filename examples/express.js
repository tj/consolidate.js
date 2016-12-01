// npm install express

var express = require('express')
var cons = require('../')
var app = express();

app.engine('vue', cons.expressVue);
app.set('view engine', 'vue');
app.set('views', __dirname + '/views');
app.set('vue', {
    componentsDir:  __dirname + '/views/components',
    defaultLayout: 'ff'
})

var users = [];
users.push({ name: 'tobi' });
users.push({ name: 'loki' });
users.push({ name: 'jane' });

app.get('/', function(req, res){
  res.render('index', {
    data: {
      title: 'Consolidate.js'
    }
  });
});

app.get('/users', function(req, res){
  res.render('users', {
    data: {
      title: 'Users',
      users: users
    }

  });
});

app.listen(3000);
console.log('Express server listening on port 3000');
