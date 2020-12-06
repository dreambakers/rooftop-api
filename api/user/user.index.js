const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const controller = require('./user.controller')
const authenticate = require('../../middleware/authenticate');

router
    .get('/getProfile', authenticate, controller.getProfile)
    .post('/changePassword', authenticate, controller.changePassword)
    .post('/updateProfile', authenticate, controller.updateProfile)

module.exports = router;