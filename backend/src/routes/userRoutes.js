const express = require('express');
const router = express.Router();
const { submitBirthDetails } = require('../controllers/userController');

router.post('/birth-details', submitBirthDetails);

module.exports = router;
