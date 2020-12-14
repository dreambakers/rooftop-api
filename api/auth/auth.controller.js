const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const { User } = require('../user/user.model');
const { sendEmail } = require('../../utility/mail');
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
                }
            });
        }
    }

    catch (error) {
        console.log(error);
        res.status(500).send('Server error');
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
        console.log(error);
        res.status(500).send('Server error');
    }
}

const logout = async ({ user, token }, res) => {
    try {
        await user.removeToken(token);
        res.json({
            success: 1
        });
    } catch (error) {
        console.log('An error occurred logging out the user', error);
        res.status(500).send('Server error');
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
        console.log('An error occurred verifying the user', error);
        res.status(500).send('Server error');
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
                        user: {
                            id: user.id
                        }
                    });
                }
            }
        } else {
            return res.status(400).json({
                errors: [{ msg: 'No user found against the provided email' }]
            });
        }
    } catch (error) {
        console.log('An error occurred sending the verification email', error);
        res.status(500).send('Server error');
    }
}

const sendPasswordResetEmail = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (user) {
                const token = await user.generateToken('password', 'passwordResetToken', '48h');
                const result = await sendEmail(
                    req.body.email,
                    constants.emailSubjects.forgotPassword,
                    constants.emailTemplates.forgotPassword,
                    {
                        passwordResetUrl: `${process.env.FE_URL}/password-reset?passwordResetToken=` + token
                    },
                    req.body.language
                );
                res.json({
                    success: result.accepted.length
                });
        } else {
            res.json({
                success: 1,
                userNotFound: true
            });
        }
    } catch (error) {
        console.log('An error occurred sending the password reset email', error);
        res.json({
            success: 0,
        });
    }
}

const verifyPasswordResetToken = async (req, res) => {
    try {
        const user = await User.findOne({ passwordResetToken: req.body.passwordResetToken });
        if (user) {
            try {
                const decoded = jwt.verify(req.body.passwordResetToken, process.env.JWT_SECRET);
                return res.json({
                    success: 1
                });
            } catch(err) {
                return res.json({
                    success: 0,
                });
            }
        }
        res.json({
            success: 0,
        });
    } catch (error) {
        console.log('An error occurred sending the password reset email', error);
        res.json({
            success: 0,
        });
    }
}

const resetPassword = async (req, res) => {
    try {
        const user = await User.findOne({ passwordResetToken: req.body.passwordResetToken });
        if (user) {
            try {
                const decoded = jwt.verify(req.body.passwordResetToken, process.env.JWT_SECRET);
                user.password = req.body.newPassword;
                user.passwordResetToken = null;
                const result = await user.save();
                res.json({
                    success: 1
                });
            } catch(err) {
                res.json({
                    success: 0,
                    invalidToken: true
                });
            }
        } else {
            res.json({
                success: 0,
                userNotFound: true
            });
        }
    } catch (error) {
        console.log('An error occurred sending the password reset email', error);
        res.json({
            success: 0,
        });
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
    console.log('error', 'Error while trying to login via Passport: ' + err);
    res.status(500).send('Server error');
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