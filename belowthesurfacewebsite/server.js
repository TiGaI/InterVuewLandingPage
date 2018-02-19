var express = require("express"),
  bodyParser = require('body-parser');

var compression = require('compression');
var helmet = require('helmet')
var routes = require('./routes/index');
var path = __dirname + '/views/';
var flash = require('connect-flash');

var app = express();
app.use(express.static(__dirname + '/public'));
app.use(compression());
app.use(helmet());
app.use(flash());

var mongoose = require('mongoose');
var connect = process.env.MONGODB_URI;
mongoose.connect(connect);

var hbs = require('express-handlebars')({
  defaultLayout: 'layout',
  extname: '.hbs'
});

app.engine('hbs', hbs);
app.set('view engine', 'hbs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use('/', routes);


app.listen(process.env.PORT || 3000, function() {
  console.log('listening on *:3000');
});


