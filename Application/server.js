var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');


//Express
var app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());


app.get('/', function (req, res) {
    res.sendfile('./public/index.html');
})
//Routes defined in api.js
app.use('/api', require('./server/api'));

//start server
app.listen(3000);
console.log("API is running on port 3000");
