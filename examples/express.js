// npm install express

var express = require('express');
var path = require('path');
var cons = require('../');
var app = express();

app.engine('vue', cons.expressVue);
app.set('view engine', 'vue');
app.set('views', path.join(__dirname, '/views'));
app.set('vue', {
  componentsDir: path.join(__dirname, '/views/components'),
  defaultLayout: 'layout'
})

var users = [];
users.push({ name: 'tobi', age: 12 });
users.push({ name: 'loki', age: 14  });
users.push({ name: 'jane', age: 16  });

app.get('/', function(req, res){
  res.render('index', {
    data: {
        title: 'Express Vue',
        message: 'Hello!',
        users: users
    },
    vue: {
        components: ['users', 'message']
    }
  });
});

app.get('/users/:userName', function(req, res){
    var user = users.filter(function(item) {
        return item.name === req.params.userName;
    })[0];
  res.render('user', {
    data: {
      title: 'Hello My Name is',
      user: user
    }

  });
});

app.listen(3000);
console.log('Express server listening on port 3000');
