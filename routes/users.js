const express = require('express');
const { check, oneOf } = require('express-validator');
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage })

const {
  getUser,
  editUser,
  updateUser,
  deleteUser,
  followUser
} = require('../controllers/users');
const { isLoggedIn, isUserAuthorized } = require('../middleware/auth');

const router = express.Router();

router.get('/:slug', getUser);

router.get('/:slug/edit', isLoggedIn, isUserAuthorized, editUser);

router.put(
  '/:slug',
  isLoggedIn,
  isUserAuthorized,
  upload.single('image'),
  oneOf([
    [
      check('name')
        .exists()
        .not()
        .isEmpty()
        .withMessage('Name should not be empty'),
      check('introduction')
        .exists()
        .isLength({ max: 500 })
        .withMessage('Introduction should be within 500 chars long'),
    ],
    check('newEmail')
      .exists()
      .normalizeEmail()
      .isEmail()
      .withMessage('invalid email address'),
    check('newPassword')
      .exists()
      .isLength({ min: 5 })
      .withMessage('Password must be at least 5 chars long')
  ]),
  updateUser
);

router.delete('/:slug', isLoggedIn, isUserAuthorized, deleteUser);

router.post('/:slug/follow', isLoggedIn, followUser);

module.exports = router;