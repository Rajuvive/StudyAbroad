const mongoose = require('mongoose');

const mongooseConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
};

module.exports = async () => {
  await mongoose.connect(process.env.MONGODB_URI, mongooseConfig);
  console.log('Mongoose connected!')
};