const { validationResult } = require('express-validator');

const School = require('../models/School');
const Review = require('../models/Review');
const User = require('../models/User');
const Inquiry = require('../models/Inquiry');
const CustomError = require('../utils/CustomError');
const sendEmail = require('../utils/sendEmail');

exports.landing = async (req, res, next) => {
  try {
    const latestSchools =
      await School
        .find()
        .sort({ createdAt: -1 })
        .populate('reviews')
        .limit(3);

    const latestReviews =
      await Review
        .find()
        .sort({ createdAt: -1 })
        .populate('school')
        .limit(3);

    res.render('landing', {
      title: 'Main Page',
      latestSchools,
      latestReviews
    });
  } catch (err) {
    const error = new CustomError('Something went wrong', 500);
    return next(error);
  }
};

exports.newInquiry = (req, res, next) => {
  res.render('others/inquiry', {
    title: 'Inquiry',
    formContent: 'inquiry'
  });
};

exports.sendInquiry = async (req, res, next) => {
  const { name, email, inquiry } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('others/inquiry', {
      error: errors.array()[0].msg,
      title: 'Inquiry',
      formContent: 'inquiry',
      name,
      email,
      inquiry
    });
  }

  try {
    const inquiry = await Inquiry.create(req.body);

    // if user exists, save user information into Inquiry model
    const user = await User.findOne({ email });
    if (user) {
      inquiry.isRegisteredUser = true;
      inquiry.user = user;
      await inquiry.save();
    }

    // for email
    const subject = 'Inquiry sent to our team successfully!';
    const message =
      `Hello ${name},\n\n` +
      'We received your inquiry and will get back to you as soon as possible.\n\n' +
      'Thanks,\n' +
      'Study Abroad! team\n';

    try {
      // send email to user
      await sendEmail(email, subject, message);

      req.flash('success', 'Inquiry sent to our team successfully!');
      res.redirect('/schools');
    } catch (err) {
      req.flash('error', 'Email could not be sent. Please try again');
      return res.status(422).render('others/inquiry', {
        title: 'Inquiry',
        formContent: 'inquiry',
        name,
        email,
        inquiry
      });
    }
  } catch (err) {
    const error = new CustomError('Something went wrong', 500);
    return next(error);
  }
};