const express = require('express');
const { check } = require('express-validator');
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage })

const {
  getSchools,
  newSchool,
  createSchool,
  getSchool,
  editSchool,
  updateSchool,
  deleteSchool,
  favoriteSchool
} = require('../controllers/schools');
const { isLoggedIn, isSchoolAuthorized } = require('../middleware/auth');

const router = express.Router();

router.get('/', getSchools);

router.get('/new', isLoggedIn, newSchool);

router.post(
  '/',
  isLoggedIn,
  upload.single('image'),
  [
    check('name')
      .not()
      .isEmpty()
      .withMessage('Name should not be empty'),
    check('address')
      .not()
      .isEmpty()
      .withMessage('Address should not be empty'),
  ],
  createSchool
);

router.get('/:slug', getSchool);

router.get('/:slug/edit', isLoggedIn, isSchoolAuthorized, editSchool);

router.put(
  '/:slug',
  isLoggedIn,
  isSchoolAuthorized,
  upload.single('image'),
  [
    check('name')
      .not()
      .isEmpty()
      .withMessage('Name should not be empty'),
    check('address')
      .not()
      .isEmpty()
      .withMessage('Address should not be empty'),
  ],
  updateSchool
);

router.delete('/:slug', isLoggedIn, isSchoolAuthorized, deleteSchool);

router.post('/:slug/favorite', isLoggedIn, favoriteSchool);

module.exports = router;