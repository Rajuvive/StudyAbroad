const CustomError = require('../utils/CustomError');
const School = require('../models/School');

exports.getRanking = async (req, res, next) => {
  try {
    const favoritedSchools =
      await School
        .find()
        .sort({ likes: -1 })
        .populate('reviews');

    const ratedSchools =
      await School
        .find()
        .sort({ averageRating: -1 })
        .populate('reviews');

    const reviewedSchools =
      await School
        .find()
        .sort({ reviews: -1 })
        .populate('reviews');

    const latestSchools =
      await School
        .find()
        .sort({ createdAt: -1 })
        .populate('reviews');
    
    res.render('ranking/ranking', {
      title: 'Ranking',
      favoritedSchools,
      ratedSchools,
      reviewedSchools,
      latestSchools
    });
  } catch (err) {
    const error = new CustomError('Something went wrong', 500);
    return next(error);
  }
};