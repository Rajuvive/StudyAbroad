const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

const User = require("../models/User");
const School = require('../models/School');
const Review = require('../models/Review');
const CustomError = require('../utils/CustomError');
const { cloudinary } = require('../config/cloudinary');

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ slug: req.params.slug }).populate('followed');
    let mypage = false;
    let title = `${user.name}'s Page`;

    // the user above is following targetUsers
    const targetUsers = await User.find({ followed: { $in: [user._id] } });

    // User page becomes My Page if login user is watching his/herself page
    if (req.user && user._id.toString() === req.user._id.toString()) {
      mypage = true;
      title = 'My Page';
    }
    
    const schools =
      await School
        .find({ likes: { $in: [user._id] } })
        .populate('reviews')
        .populate('likes');

    const reviews =
      await Review
        .find({ user: user._id })
        .populate('school');

    // change Follow Button if the user who is logging in follows target user
    const isFollowing = checkIsFollowing(req, user);

    res.render('users/user', {
      title,
      user,
      targetUsers,
      schools,
      reviews,
      mypage,
      isFollowing
    });
  } catch (err) {
    const error = new CustomError('Something went wrong', 500);
    return next(error);
  }
};

exports.editUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ slug: req.params.slug });

    // the user above is following targetUsers
    const targetUsers = await User.find({ followed: { $in: [user._id] } });

    res.render('users/edit', {
      title: 'My Page',
      formContent: req.query.content,
      user,
      targetUsers,
      mypage: true,
    });
    
  } catch (err) {
    const error = new CustomError('Something went wrong', 500);
    return next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ slug: req.user.slug });
    const errors = validationResult(req);

    if (req.body.content === 'profile') {
      if (!errors.isEmpty()) {
        const targetError =
          errors.array()[0].nestedErrors
            .find(content =>
              content.param === 'name' || content.param === 'introduction'
            );
    
        return res.status(422).render('users/edit', {
          error: targetError.msg,
          title: 'My Page',
          formContent: 'profile',
          user: { ...req.body },
          mypage: true,
        });
      }

      const existingUser = await User.findOne({ name: req.body.name });

      if (existingUser && existingUser._id.toString() !== req.user.id.toString()) {
        return res.status(401).render('users/edit', {
          error: 'This username has already been registered',
          title: 'My Page',
          formContent: 'profile',
          user: { ...req.body },
          mypage: true,
        });
      }

      if (req.file) {
        if (user.image.url && (user.image.url !== '../uploads/no-photo-user.jpg')) {
          await cloudinary.uploader.destroy(user.image.filename);
        }
        req.body.image = { url: req.file.path, filename: req.file.filename };
        user.image = req.body.image;
      }

      user.name = req.body.name;
      user.introduction = req.body.introduction;
      user.studentType = req.body.studentType;
    }
    
    if (req.body.content === 'email') {
      if (!errors.isEmpty()) {
        const targetError =
          errors.array()[0].nestedErrors
            .find(content =>
              content.param === 'newEmail'
            );
        return res.status(422).render('users/edit', {
          error: targetError.msg,
          title: 'My Page',
          formContent: 'email',
          user: { ...req.body },
          mypage: true,
        });
      }

      const existingUser = await User.findOne({ email: req.body.newEmail });

      if (existingUser) {
        return res.status(401).render('users/edit', {
          error: 'This email has already been registered',
          title: 'My Page',
          formContent: 'email',
          user: { ...req.body },
          mypage: true,
        });
      }

      user.email = req.body.newEmail;
    }

    if (req.body.content === 'password') {
      if (!errors.isEmpty()) {
        const targetError =
          errors.array()[0].nestedErrors
            .find(content =>
              content.param === 'newPassword'
            );
        return res.status(422).render('users/edit', {
          title: 'My Page',
          error: targetError.msg,
          formContent: 'password',
          mypage: true,
        });
      }

      const { currentPassword, newPassword, confirmNewPassword } = req.body;
      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (!isMatch) {
        return res.status(401).render('users/edit', {
          title: 'My Page',
          error: 'incorrect current password',
          formContent: 'password',
          mypage: true,
        });
      }

      if (newPassword !== confirmNewPassword) {
        return res.status(401).render('users/edit', {
          title: 'My Page',
          error: 'Confirm password failed',
          formContent: 'password',
          mypage: true,
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      user.password = hashedPassword;
    }

    await user.save()

    req.flash('success', 'Editted your account!');
    res.redirect(`/users/${user.slug}`);
  } catch (err) {
    const error = new CustomError('Something went wrong', 500);
    return next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ slug: req.params.slug });

    // Admin user cannot be deleted (need to manipulate database directly)
    if (user.isAdmin) {
      req.flash('error', 'Admin user cannot be deleted');
      res.redirect(`/users/${user.slug}`);
    }

    if (user.image.url !== 'uploads\\no-photo.jpg') {
      await cloudinary.uploader.destroy(user.image.filename);
    }

    await user.remove();

    req.flash('success', 'Deleted your account!');
    res.redirect(`/schools`);
  } catch (err) {
    const error = new CustomError('Something went wrong', 500);
    return next(error);
  }
};

exports.followUser = async (req, res, next) => {
  try {
    const targetUser = await User.findOne({ slug: req.params.slug });
    if (!targetUser) {
      const error = new CustomError('User not found', 404);
      return next(error);
    }

    // the user who is logging in cannot follow his/her own page
    if (targetUser._id.toString() === req.user._id.toString()) {
      req.flash('error', 'You cannot follow yourself');
      return res.redirect(`/users/${targetUser.slug}`);
    }

    // follow or unfollow depending whether the user who is logging in follows target user
    const isFollowing = checkIsFollowing(req, targetUser);
    if (isFollowing) {
      targetUser.followed.pull(req.user._id);
    } else {
      targetUser.followed.push(req.user);
    }
    await targetUser.save();

    return res.redirect(`/users/${targetUser.slug}`);
  } catch (err) {
    const error = new CustomError('Something went wrong', 500);
    return next(error);
  }
};

const checkIsFollowing = (req, targetUser) => {
  if (req.user) {
    return targetUser.followed.some(followingUser => 
      followingUser.equals(req.user._id)
    );
  } else {
    return false;
  }
};