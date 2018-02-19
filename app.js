var express = require('express'),
  stormpath = require('express-stormpath'),
  handlebars = require('express-handlebars'),
  hbs = require('hbs'),
  path = require('path'),
  bodyParser = require('body-parser'),
  flash = require('connect-flash'),
  models = require('./models');
var session = require('express-session');

var Email = models.Email;
var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
var helper = require('sendgrid').mail;
var mongoose = require('mongoose');
var connect = process.env.MONGODB_URI || require('./models');
var http = require("http");
setInterval(function() {
  http.get("http://newvuew.herokuapp.com");
}, 300000);

mongoose.connect(connect);

var app = express();

app.use(session({
  cookie: {
    maxAge: 60000
  },
  secret: 'woot',
  resave: 'true',
  saveUninitialized: true
}));

app.set('view engine', 'hbs');

// Enable form validation with express validator.
var validator = require('express-validator');
app.use(validator());
app.use(flash());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

//Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));


app.use(function(req, res, next) {
  // if there's a flash message in the session request, make it available in the response, then delete it
  res.locals.sessionFlash = req.session.sessionFlash;
  delete req.session.sessionFlash;
  next();
});

// Route that creates a flash message using custom middleware
app.all('/express-flash', function(req, res) {
  req.flash('error', 'This is a flash message using the express-flash module.');
  res.redirect(301, '/');
});

app.get('/', function(req, res) {
  res.render('index');
})

function validate(req) {
  req.checkBody('email', 'the form is empty').notEmpty();
  req.checkBody("email", "Enter a valid email address.").isEmail();
}

app.post('/email', function(req, res) {
  console.log(req.body)

  validate(req);
  var errors = req.validationErrors();
  if (!errors) {
    Email.findOne({
      email: req.body.email
    }).exec(function(err, email) {
      if (err) {
        res.render('index', {
          email: req.body.email,
          expressFlash: err
        });
      } else {
        if (!email) {
          var email = new Email({
            email: req.body.email,
          });

          email.save(function(err) {
            if (!err) {

              from_email = new helper.Email('newvuew@gmail.com');
              to_email = new helper.Email(req.body.email);
              subject = 'Welcome to NewVuew';
              content = new helper.Content('text/html', '<p>Welcome to this invite-only subscription!</p><p>We will notify you once our phone application is deployed.</p>');
              mail = new helper.Mail(from_email, subject, to_email, content);
              mail.setTemplateId('554df4c0-e9b6-49a4-a4e2-0468b0e35106');

              var request = sg.emptyRequest({
                method: 'POST',
                path: '/v3/mail/send',
                body: mail.toJSON()
              });

              sg.API(request, function(error, response) {
                if (error) {
                  return console.log(error);
                }
                console.log(response)
                console.log('Yay! Our templated email has been sent')
              })

              Email.count({}).exec(function(err, count) {
                res.render('index', {
                  emailcount: count + 432,
                  checkformessage: true
                });
              });
            } else {
              req.flash('error', err);
              res.render('index', {
                expressFlash: err
              });
            }
          });
        } else {
          res.render('index', {
            email: req.body.email,
            expressFlash: 'This email has already sign u'
          });
        }
      }

    });

  } else {
    res.render('index', {
      email: req.body.email,
      expressFlash: errors[0].msg
    });
  }

});


app.listen(process.env.PORT || 3000, function() {
  console.log('Success, running on port 3000');
});