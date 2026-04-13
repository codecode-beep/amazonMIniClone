const express= require('express');
const { check, body } = require('express-validator');

const authController= require('../controller/auth');
const isAuth= require('../middelware/isAuth');
const User = require('../models/user');
const shopController = require('../controller/product/fetchProduct');
const orderController = require('../controller/product/order');


const router =express.Router();

router.get('/signin',authController.getSignin);
router.get('/test',isAuth,authController.getTest);
router.get('/signup',authController.getSignup);
router.get('/home', shopController.getHome); 
router.get('/products', shopController.getHome);

router.post(
    '/signup',
    [
      check('email')
        .isEmail()
        .withMessage('Please enter a valid email.')
        .custom((value, { req }) => {
          return User.findOne({ email: value }).then(userDoc => {
            if (userDoc) {
              return Promise.reject(
                'E-Mail exists already, please pick a different one.'
              );
            }
          });
        }),
      body(
        'password',
        'Please enter a password with only numbers and text and at least 5 characters.'
      )
        .isLength({ min: 5 })
        .isAlphanumeric(),
      body('passwordConfirm').custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords have to match!');
        }
        return true;
      })
    ],
    authController.postSignup
  );

router.post('/signin',
    [
      body('email')
        .isEmail()
        .withMessage('Please enter a valid email address.'),
      body('password', 'Password has to be valid.')
        .isLength({ min: 5 })
        .isAlphanumeric()
    ],
    authController.postSignin
  );
router.post('/logout', authController.postLogout);
router.get('/products/search',shopController.getSearchProducts);

router.get("/cart", orderController.getCart);
router.post('/cart/add', orderController.addToCart);
router.post("/cart/increase/", orderController.increaseQuantity);
router.post("/cart/decrease/", orderController.decreaseQuantity);
router.post("/cart/remove/", orderController.removeFromCart);


router.get("/product/:id", shopController.getProduct);


// Reviews
router.post("/product/:id/review", isAuth, shopController.addReview);
router.put("/product/:id/review/:reviewId", isAuth, shopController.updateReview);
router.delete("/product/:id/review/:reviewId", isAuth, shopController.deleteReview);

router.get("/checkout",isAuth,orderController.getCheckout);
router.get("/checkout/success",orderController.getCheckoutSuccess);
router.get("/checkout/cancel",orderController.getCheckout);

router.get("/orders",isAuth,orderController.getOrder);
router.get("/cancel/:itemId", isAuth,orderController.getOrderCancelItem);
router.post("/cancel/:itemId", isAuth,orderController.postOrderCancel);



module.exports= router;