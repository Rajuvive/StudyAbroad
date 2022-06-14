const mongoose = require('mongoose');

const InquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  inquiry: {
    type: String,
    maxlength: 500
  },
  isReplied: {
    type: Boolean,
    default: false
  },
  isRegisteredUser: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
});

module.exports = mongoose.model('Inquiry', InquirySchema);