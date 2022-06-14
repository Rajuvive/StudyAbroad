const { validationResult } = require('express-validator');

const School = require('../models/School');
const Review = require('../models/Review');
const CustomError = require('../utils/CustomError');
const { cloudinary } = require('../config/cloudinary');

exports.getSchools = async (req, res, next) => {
  // Pagination
  const perPage = 8;
  const pageQuery = parseInt(req.query.page);
  const pageNumber = pageQuery ? pageQuery : 1;

  try {
    const schools =
      await School
        .find()
        .skip((perPage * pageNumber) - perPage)
        .limit(perPage)
        .populate('reviews');
    const count = await School.countDocuments();
    const pages = Math.ceil(count / perPage);

    res.render('schools/schools', {
      title: 'Schools',
      currentPage: pageNumber,
      schools,
      pages
    });
  } catch (err) {
    const error = new CustomError('Something went wrong', 500);
    return next(error);
  }
};

exports.newSchool = async (req, res, next) => {
  res.render('schools/new', {
    title: 'Add New School',
    formContent: 'addSchool'
  });
};

exports.createSchool = async (req, res, next) => {
  const school = req.body
  req.body.user = req.user.id;
  if (req.file) {
    req.body.image = { url: req.file.path, filename: req.file.filename };
  }
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('schools/new', {
      error: errors.array()[0].msg,
      title: 'Add New School',
      formContent: 'addSchool',
      school
    });
  }

  try {
    const existingSchool = await School.findOne({ name: req.body.name });
    if (existingSchool) {
      return res.status(401).render('schools/new', {
        error: 'This school has already been registered',
        title: 'Add New School',
        formContent: 'addSchool',
        school
      });
    }

    await School.create(req.body);
    req.flash('success', 'Created new school!');
    res.redirect('/schools');
  } catch (err) {
    const error = new CustomError('Something went wrong', 500);
    return next(error);
  }
};

exports.getSchool = async (req, res, next) => {
  try {
    const school =
      await School
        .findOne({ slug: req.params.slug })
        .populate('reviews')
        .populate('likes');
    const reviews = await Review.find({ school: school._id });

    if (!school) {
      const error = new CustomError('School not found', 404);
      return next(error);
    }

    // check the user who is logging in has favorite of this school (true or false)
    const isFavoriteUser = checkIsFavoriteUser(req, school);

    // check the user who is logging in has already written Review to the School
    const isUserHasReview = checkIsUserHasReview(req, reviews);

    const limitedReviews =
      await Review
        .find({ school: school._id })
        .limit(3)
        .populate('user');

    const popularSchools =
      await School
        .find()
        .sort({ likes: -1 })
        .populate('reviews')
        .limit(3);

    const newArrivalSchools =
      await School
        .find()
        .sort({ createdAt: -1 })
        .populate('reviews')
        .limit(3);

    res.render('schools/show', {
      title: school.name,
      school,
      popularSchools,
      newArrivalSchools,
      isFavoriteUser,
      isUserHasReview,
      reviews: limitedReviews
    });
  } catch (err) {
    const error = new CustomError('Something went wrong', 500);
    return next(error);
  }
};

exports.editSchool = async (req, res, next) => {
  try {
    const school = await School.findOne({ slug: req.params.slug });

    res.render('schools/edit', {
      title: 'Edit school',
      formContent: 'editSchool',
      school
    });
  } catch (err) {
    const error = new CustomError('Something went wrong', 500);
    return next(error);
  }
};

exports.updateSchool = async (req, res, next) => {
  const _id = req.params.schoolId;
  let school = { ...req.body, _id };

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('schools/edit', {
      error: errors.array()[0].msg,
      title: 'Edit School',
      formContent: 'editSchool',
      school
    });
  }
  
  try {
    school = await School.findOne({ slug: req.params.slug });

    if (req.file) {
      if (school.image.url !== '../uploads/no-photo-school.jpg') {
        await cloudinary.uploader.destroy(school.image.filename);
      }
      req.body.image = { url: req.file.path, filename: req.file.filename };
      school.image = req.body.image;
    }
    
    school.name = req.body.name;
    school.address = req.body.address;
    school.type = req.body.type;
    school.description = req.body.description;
    school.website = req.body.website;

    await school.save();

    req.flash('success', 'Editted product!');
    res.redirect('/schools');
  } catch (err) {
    const error = new CustomError('Something went wrong', 500);
    return next(error);
  }
};

exports.deleteSchool = async (req, res, next) => {
  try {
    const school = await School.findOne({ slug: req.params.slug });
    
    if (school.image.url !== '../uploads/no-photo-school.jpg') {
      await cloudinary.uploader.destroy(school.image.filename);
    }

    await school.remove();

    req.flash('success', 'Deleted school!');
    res.redirect('/schools');
  } catch (err) {
    const error = new CustomError('Something went wrong', 500);
    return next(error);
  }
};

exports.favoriteSchool = async (req, res, next) => {
  try {
    const school = await School.findOne({ slug: req.params.slug });
    if (!school) {
      const error = new CustomError('School not found', 404);
      return next(error);
    }

    // follow or unfollow depending whether the user who is logging in is being favorite of the school
    const isFavoriteUser = checkIsFavoriteUser(req, school);
    if (isFavoriteUser) {
      school.likes.pull(req.user._id);
    } else {
      school.likes.push(req.user);
    }

    // Address field is required for the School Model
    school.address = school.location.formattedAddress

    await school.save();

    return res.redirect(`/schools/${school.slug}`);
  } catch (err) {
    const error = new CustomError('Something went wrong', 500);
    return next(error);
  }
};

const checkIsFavoriteUser = (req, school) => {
  if (req.user) {
    return school.likes.some(favoriteUser => 
      favoriteUser.equals(req.user._id)
    );
  } else {
    return false;
  }
};

const checkIsUserHasReview = (req, reviews) => {
  if (req.user) {
    return reviews.some(review => 
      review.user.equals(req.user._id)
    );
  } else {
    return false;
  }
};