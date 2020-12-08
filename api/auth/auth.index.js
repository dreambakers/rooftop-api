const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const { check } = require('express-validator');
const controller = require('./auth.controller')
const authenticate = require('../../middleware/authenticate');

passport.use(new GoogleStrategy({
    clientID: `${process.env.GOOGLE_CLIENT_ID}`,
    clientSecret: `${process.env.GOOGLE_CLIENT_SECRET}`,
    callbackURL: `${process.env.GOOGLE_CB_URL}`
  },
  controller.onGoogleAuthentication
));

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
    .get('/google', passport.authenticate('google', {
        scope: ['profile', 'email']
    }))
    .get('/google/callback', passport.authenticate('google', {
            failureRedirect: '/login',
            session: false
        }),
        function (req, res) {
            res.header('x-auth', req.user.token).send(req.user);
        }
    )

module.exports = router;