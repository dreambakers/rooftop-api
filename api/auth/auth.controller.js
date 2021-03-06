const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const { User } = require('../user/user.model');
const { sendEmail } = require('../../utility/mail');
const winston = require('../../config/winston');
const constants = require('../../constants');

const signUp = async (req, res) => {
    try {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, username } = req.body;

        const inUse = await Promise.all([
            User.findOne({ email }),
            User.findOne({ username })
        ]);

        if (inUse[0] || inUse[1]) {
            const inUseErrors = [];

            if (inUse[0]) {
                inUseErrors.push({ msg: 'Email already in use' });
            }

            if (inUse[1]) {
                inUseErrors.push({ msg: 'Username already in use' });
            }

            return res.status(400).json({
                errors: inUseErrors
            });
        }

        const newUser = new User({
            email,
            password,
            username
        });

        const user = await newUser.save();
        const token = await user.generateToken('verification', 'verificationToken', '48h');
        const result = await sendEmail(
            newUser.email,
            constants.emailSubjects.signupVerification,
            constants.emailTemplates.signupVerification,
            {
                userEmail: newUser.email,
                verificationUrl: `${process.env.FE_URL}/verify?verificationToken=` + token
            }
        );

        if (result.accepted && result.accepted.length) {
            res.json({
                user: {
                    id: user.id
                },
                msg: "Email sent"
            });
        }
    }

    catch (error) {
        winston.error('An error occurred while signing up the new user', error);
        res.status(500).json({ msg: 'Server Error' });
    }
}

const login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;
        const user = await User.findByCredentials(username, password);

        if (!user) {
            return res.status(400).json({
                errors: [{ msg: 'Invalid Credentials' }]
            });
        } else if (!user.verified) {
            return res.status(400).json({
                errors: [{ msg: 'Email not verified' }]
            });
        }

        const token = await user.generateAuthToken();
        user.cleanupOldTokens();
        res.header('x-auth', token).send(user);
    } catch (error) {
        winston.error('An error occurred while logging in the user', error);
        res.status(500).json({ msg: 'Server Error' });
    }
}

const logout = async ({ user, token }, res) => {
    try {
        await user.removeToken(token);
        res.json({
            success: 1
        });
    } catch (error) {
        winston.error('An error occurred logging out the user', error);
        res.status(500).json({ msg: 'Server Error' });
    }
}

const verifySignup = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const user = await User.findOne({ verificationToken: req.body.verificationToken });
        if (user) {
            try {
                const decoded = jwt.verify(req.body.verificationToken, process.env.JWT_SECRET);
                const result = await User.findOneAndUpdate(
                    {
                        verificationToken: req.body.verificationToken
                    },
                    {
                        verified: true,
                        verificationToken: null
                    },
                    {
                        new: true
                    }
                );
                return res.json({
                    user: {
                        id: result.id,
                        verified: result.verified
                    }
                });
            } catch(err) {
                return res.status(400).json({
                    errors: [{ msg: 'Invalid verification token' }]
                });
            }
        }

        return res.status(400).json({
            errors: [{ msg: 'No user found against the provided token' }]
        });
    } catch (error) {
        winston.error('An error occurred verifying the user', error);
        res.status(500).json({ msg: 'Server Error' });
    }
}

const sendSignupVerificationEmail = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const user = await User.findOne({ email: req.body.email });
        if (user) {
            if (user.verified) {
                return res.status(400).json({
                    errors: [{ msg: 'User is already verified' }]
                });
            } else {
                const token = await user.generateToken('verification', 'verificationToken', '48h');
                const result = await sendEmail(
                    req.body.email,
                    constants.emailSubjects.signupVerification,
                    constants.emailTemplates.signupVerification,
                    {
                        userEmail: req.body.email,
                        verificationUrl: `${process.env.FE_URL}/verify?verificationToken=` + token
                    }
                );
                if (result.accepted && result.accepted.length) {
                    res.json({
                        msg: "Email sent"
                    });
                }
            }
        } else {
            return res.status(400).json({
                errors: [{ msg: 'No user found against the provided email' }]
            });
        }
    } catch (error) {
        winston.error('An error occurred sending the verification email', error);
        res.status(500).json({ msg: 'Server Error' });
    }
}

const sendPasswordResetEmail = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const user = await User.findOne({ email: req.body.email });
        if (user) {
                const token = await user.generateToken('password', 'passwordResetToken', '48h');
                const result = await sendEmail(
                    req.body.email,
                    constants.emailSubjects.forgotPassword,
                    constants.emailTemplates.forgotPassword,
                    {
                        passwordResetUrl: `${process.env.FE_URL}/password-reset?passwordResetToken=` + token
                    }
                );
                if (result.accepted && result.accepted.length) {
                    res.json({
                        msg: "Email sent"
                    });
                }
        } else {
            return res.status(400).json({
                errors: [{ msg: 'No user found against the provided email' }]
            });
        }
    } catch (error) {
        winston.error('An error occurred sending the password reset email', error);
        res.status(500).json({ msg: 'Server Error' });
    }
}

const verifyPasswordResetToken = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const user = await User.findOne({ passwordResetToken: req.body.passwordResetToken });
        if (user) {
            try {
                const decoded = jwt.verify(req.body.passwordResetToken, process.env.JWT_SECRET);
                return res.json({
                    msg: "Token valid"
                });
            } catch(err) {
                return res.status(400).json({
                    errors: [{ msg: 'Invalid password reset token' }]
                });
            }
        }
        return res.status(400).json({
            errors: [{ msg: 'No user found against the provided token' }]
        });
    } catch (error) {
        winston.error('An error occurred verifying the password reset token', error);
        res.status(500).json({ msg: 'Server Error' });
    }
}

const resetPassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const user = await User.findOne({ passwordResetToken: req.body.passwordResetToken });
        if (user) {
            try {
                const decoded = jwt.verify(req.body.passwordResetToken, process.env.JWT_SECRET);
                user.password = req.body.newPassword;
                user.passwordResetToken = null;
                const result = await user.save();
                return res.json({
                    msg: "Password updated"
                });
            } catch(err) {
                return res.status(400).json({
                    errors: [{ msg: 'Invalid password reset token' }]
                });
            }
        }
        return res.status(400).json({
            errors: [{ msg: 'No user found against the provided token' }]
        });
    } catch (error) {
        winston.error('An error occurred resetting the password', error);
        res.status(500).json({ msg: 'Server Error' });
    }
}

const onPassportAuthentication = async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        const user = await User.findOne({ email });

        if (!user) {
            let newUser = new User({
                email,
                username: profile.name.givenName + profile.id,
                verified: true,
                provider: profile.provider
            });

            newUser = await newUser.save();
            const token = await newUser.generateAuthToken();
            done(null, {token, id: newUser.id});
        } else {
            const token = await user.generateAuthToken();
            user.cleanupOldTokens();
            done(null, {token, id: user.id});
        }
    } catch (error) {
        throw error;
    }
}

const onPassportAuthenticationFinish = (req, res) => {
    res.header('x-auth', req.user.token).send(req.user);
}

const passportErrorHandler = (err, req, res, next) => {
    winston.error('Error while trying to login via Passport', err);
    res.status(500).json({ msg: 'Server Error' });
}

module.exports = {
    login,
    signUp,
    logout,
    verifySignup,
    sendSignupVerificationEmail,
    sendPasswordResetEmail,
    resetPassword,
    verifyPasswordResetToken,
    onPassportAuthentication,
    onPassportAuthenticationFinish,
    passportErrorHandler
}