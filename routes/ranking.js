const express = require('express');

const {
  getRanking,
} = require('../controllers/ranking');

const router = express.Router();

router.get('/', getRanking);

module.exports = router;