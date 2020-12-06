const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const controller = require('./auth.controller')
const authenticate = require('../../middleware/authenticate');

router
    .post('/', [
        check('email', 'Please include a valid email').isEmail(),
        check('username', 'Username is required').exists(),
        check('password', 'Password is required').exists()
    ], controller.signUp)
    .post('/login', [
        check('username', 'Username is required').exists(),
        check('password', 'Password is required').exists()
    ], controller.login)
    .post('/logout', authenticate, controller.logout)
    .post('/verifySignup', controller.verifySignup)
    .post('/sendSignupVerificationEmail', controller.sendSignupVerificationEmail)
    .post('/requestPasswordResetEmail', controller.sendPasswordResetEmail)
    .post('/verifyPasswordResetToken', controller.verifyPasswordResetToken)
    .post('/resetPassword', controller.resetPassword)

module.exports = router;