const express = require('express');
const router = express.Router();
var passport = require('passport'),
    GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
    FacebookStrategy = require('passport-facebook').Strategy;
const { check } = require('express-validator');
const controller = require('./auth.controller')
const authenticate = require('../../middleware/authenticate');

passport.use(new GoogleStrategy({
        clientID: `${process.env.GOOGLE_CLIENT_ID}`,
        clientSecret: `${process.env.GOOGLE_CLIENT_SECRET}`,
        callbackURL: `${process.env.GOOGLE_CB_URL}`
    },
    controller.onPassportAuthentication
));

passport.use(new FacebookStrategy({
        clientID: `${process.env.FACEBOOK_CLIENT_ID}`,
        clientSecret: `${process.env.FACEBOOK_CLIENT_SECRET}`,
        callbackURL: `${process.env.FACEBOOK_CB_URL}`,
        profileFields: ['id', 'emails', 'name']
    },
    controller.onPassportAuthentication
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
    .post('/verifySignup', [
        check('verificationToken', 'Verification token is required').exists(),
    ], controller.verifySignup)
    .post('/sendSignupVerificationEmail', [
        check('email', 'Please include a valid email').isEmail(),
    ], controller.sendSignupVerificationEmail)
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
        controller.passportErrorHandler,
        controller.onPassportAuthenticationFinish
    )
    .get('/facebook', passport.authenticate('facebook', {
        scope: ['email']
    }))
    .get('/facebook/callback', passport.authenticate('facebook', {
            failureRedirect: '/login',
            session: false
        }),
        controller.passportErrorHandler,
        controller.onPassportAuthenticationFinish
    );

module.exports = router;