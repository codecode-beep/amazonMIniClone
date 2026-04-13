const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

const User = require('../models/user');
const { sendSignupEmail } = require("./email.js");
const { name } = require('ejs');

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message,
    oldInput: { name:'',email:''},
  });
};

exports.getSignin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('signin', {
    path: '/signin',
    pageTitle: 'Signin',
    errorMessage: message,
    oldInput: {
      email: '',
      password: ''
    },
  });
};

exports.getTest=(req,res,next)=>{
    res.render('test');
}

exports.postSignup = (req, res, next) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput: { name: name, email: email },
    });
  }

  bcrypt
    .hash(password, 12)
    .then(hashedPassword => {
      const user = new User({
        name: name,
        email: email,
        password: hashedPassword,
        cart: { items: [] }
      });
      return user.save();
    })
    .then(async user => {
      // send email AFTER saving user
      await sendSignupEmail(user);

      res.redirect('/signin');
    })
    .catch(err => {
      console.log("Signup Error:", err);
    });
};

exports.postSignin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('signin', {
      path: '/signin',
      pageTitle: 'Signin',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password
      },
    });
  }

  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        return res.status(422).render('signin', {
          path: '/signin',
          pageTitle: 'Signin',
          errorMessage: 'Invalid email or password.',
          oldInput: {
            email: email,
            password: password
          },
        });
      }
      bcrypt
        .compare(password, user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              res.redirect('/home');
            });
          }
          return res.status(422).render('signin', {
            path: '/signin',
            pageTitle: 'Signin',
            errorMessage: 'Invalid email or password.',
            oldInput: {
              email: email,
              password: password
            },
          });
        })
        .catch(err => {
          console.log(err);
          res.redirect('/signin');
        });
    })
    .catch(err => console.log(err));
};

  exports.postLogout = (req, res, next) => {
    console.log('its logout function');
    req.session.destroy(err => {
        if(err){
            console.log(err);
            return res.redirect('/home');
        }
        res.redirect('/signin'); 
    });
  };