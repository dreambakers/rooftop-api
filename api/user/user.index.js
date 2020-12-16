const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const controller = require('./user.controller')
const authenticate = require('../../middleware/authenticate');

router
    .get('/', authenticate, controller.getProfile)
    .post('/changePassword', [ authenticate, [
        check('oldPassword', 'Old password is required').exists(),
        check('newPassword', 'New password is required').exists()]
    ], controller.changePassword);

module.exports = router;