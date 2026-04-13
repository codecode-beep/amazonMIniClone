require('dotenv').config();
const path = require('path');
const User = require('./models/user');

const bodyParser = require('body-parser');
const express= require('express');
const mongoose= require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const methodOverride = require("method-override");

const authRoutes = require('./routes/auth');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const csrfProtection = csrf();

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('Missing MONGODB_URI in environment (.env)');
  process.exit(1);
}

const store = new MongoDBStore({
    uri: mongoUri,
    collection: 'sessions',
    connectionOptions: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        ssl: true,                 // enable SSL
        tlsAllowInvalidCertificates: true // only for testing
    }
});

  

app.set('view engine','ejs');
app.set('views','views')

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
    session({
      secret: 'my secret',
      resave: false,
      saveUninitialized: false,
      store: store
    })
  );

app.use(csrfProtection);
app.use(flash());
  
  app.use((req, res, next) => {
    if (!req.session.user) {
      return next();
    }
    User.findById(req.session.user._id)
      .then(user => {
        req.user = user;
        next();
      })
      .catch(err => console.log(err));
  });

  app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
  });

  
app.use(methodOverride("_method"));

  
  
app.use(authRoutes);
mongoose.connect(mongoUri)
.then(result =>{
    console.log('connected')
    app.listen(3000);
})
.catch(err =>{
    console.log(err);
});
