const mongoose = require('mongoose');
const slugify = require('slugify');
const geocoder = require('../utils/geocoder');

const SchoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  address: String,
  location: {
    coordinates: {
      type: [Number]
    },
    formattedAddress: String,
    street: String,
    city: String,
    state: String,
    country: String,
    zipcode: String,
  },
  image: {
    url: {
      type: String,
      default: '../uploads/no-photo-school.jpg'
    },
    filename: {
      type: String
    }
  },
  schoolType: {
    type: String,
    enum: [
      'College',
      'University',
      'Language School',
      'Other',
    ]
  },
  website: {
    type: String
  },
  description: String,
  averageRating: {
    type: Number,
    min: 1,
    max: 5
  },
  slug: {
    type: String,
    unique: true
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

SchoolSchema.pre('save', function(next) {
  this.slug = slugify(this.name, {
      replacement: '-',
      lower: true
    }
  );
  next();
});

SchoolSchema.pre('save', async function(next) {
  const res = await geocoder.geocode(this.address);
  this.location = {
    coordinates: [res[0].longitude, res[0].latitude],
    formattedAddress: res[0].formattedAddress,
    street: res[0].streetName,
    city: res[0].city,
    state: res[0].stateCode,
    country: res[0].countryCode,
    zipcode: res[0].zipcode,
  }
  // use formattedAddress instead of address
  this.address = undefined;
  next();
});

// delete Review when corresponding school is deleted
SchoolSchema.pre('remove', async function (next) {
  await this.model('Review').deleteMany({ school: this._id });
  next();
});

SchoolSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'school',
  justOne: false
});

module.exports = mongoose.model('School', SchoolSchema);