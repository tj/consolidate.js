// npm install express

var express = require('../../express');
var cons = require('../');
var app = express();
var path = require('path');

app.engine('html', cons.swig);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

var users = [];
users.push({ name: 'tobi' });
users.push({ name: 'loki' });
users.push({ name: 'jane' });

app.get('/', function(req, res) {
  res.render('index', {
    title: 'Consolidate.js'
  });
});

app.get('/users', function(req, res) {
  res.render('users', {
    title: 'Users',
    users: users
  });
});

app.listen(3000);
console.log('Express server listening on port 3000');
