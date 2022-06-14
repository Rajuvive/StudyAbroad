const mongoose = require('mongoose');
const slugify = require('slugify');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minlength: 5
  },
  introduction: {
    type: String,
    maxlength: 500
  },
  image: {
    url: {
      type: String,
      default: '../uploads/no-photo-user.jpg'
    },
    filename: {
      type: String
    }
  },
  studentType: {
    type: String,
    enum: [
      'High School Student',
      'College Student',
      'University Student',
      'Graduate School Student',
      'Worker',
      'Other'
    ]
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  slug: {
    type: String,
    unique: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  followed: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  ]
});

UserSchema.pre('save', function(next) {
  this.slug = slugify(this.name,
    {
      replacement: '-',
      lower: true
    }
  );
  next();
});

UserSchema.pre('remove', async function (next) {
  // delete School when corresponding school is deleted
  await this.model('School').deleteMany({ user: this._id });

  // remove user from likes array in School
  await this.model('School').updateMany(
    {},
    {
      $pull: { likes: { $in: [this._id] } }
    }
  );

  // delete Review when corresponding school is deleted
  await this.model('Review').deleteMany({ user: this._id });
  
  next();
});

module.exports = mongoose.model('User', UserSchema);