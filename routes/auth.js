const express = require('express');
const { check } = require('express-validator');

const {
  signupPage,
  signup,
  loginPage,
  login,
  logout,
  getForgotPassword,
  postForgotPassword,
  getResetPassword,
  putResetPassword
} = require('../controllers/auth');

const router = express.Router();

router.get('/signup', signupPage);

router.post(
  '/signup',
  [
    check('name')
      .not()
      .isEmpty()
      .withMessage('Name should not be empty'),
    check('email')
      .normalizeEmail()
      .isEmail()
      .withMessage('invalid email address'),
    check('password')
      .isLength({ min: 5 })
      .withMessage('Password must be at least 5 chars long')
  ],
  signup
);

router.get('/login', loginPage);

router.post(
  '/login',
  [
    check('email')
      .normalizeEmail()
      .isEmail()
      .withMessage('invalid email address'),
    check('password')
      .isLength({ min: 5 })
      .withMessage('Password must be at least 5 chars long')
  ],
  login
);

router.get('/logout', logout);

router.get('/forgot', getForgotPassword);

router.post('/forgot', postForgotPassword);

router.get('/reset/:passwordToken', getResetPassword);

router.put(
  '/reset/:passwordToken',
  [
    check('newPassword')
      .isLength({ min: 5 })
      .withMessage('Password must be at least 5 chars long')
  ],
  putResetPassword
);

module.exports = router;