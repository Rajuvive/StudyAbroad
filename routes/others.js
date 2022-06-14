const express = require('express');
const { check } = require('express-validator');

const {
  landing,
  newInquiry,
  sendInquiry,
} = require('../controllers/others');

const router = express.Router();

router.get('/', landing);

router.get('/inquiry/new', newInquiry);

router.post(
  '/inquiry',
  [
    check('name')
      .not()
      .isEmpty()
      .withMessage('Name should not be empty'),
    check('email')
      .normalizeEmail()
      .isEmail()
      .withMessage('invalid email address'),
    check('inquiry')
      .isLength({ max: 500 })
      .withMessage('Inquiry must be within 500 chars long')
  ],
  sendInquiry
);

module.exports = router;