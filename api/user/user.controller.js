const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { User } = require('./user.model');
const winston = require('../../config/winston');
const { pick } = require('lodash');

const getProfile = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user._id }).populate('parties').exec();
        if (user) {
            return res.json({
                user
            });
        }
        res.status(400).json({
            errors: [{ msg: 'No user found against the provided token' }]
        });
    } catch (error) {
        winston.error('An error occurred getting the user profile', error);
        res.status(500).json({ msg: 'Server Error' });
    }
}

const getProfileById = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const user = await User.findById(req.body.userId).populate('parties', 'hotOrNot endDateTime').exec();
        if (user) {
            return res.json({
                user
            });
        }
        res.status(400).json({
            errors: [{ msg: 'No user found against the provided token' }]
        });
    } catch (error) {
        winston.error('An error occurred getting the user profile', error);
        res.status(500).json({ msg: 'Server Error' });
    }
}

const updateProfile = async (req, res) => {
    try {
        const editableFields = ['profilePicture', 'bio'];
        let user = pick(req.body, editableFields);
        user = await User.findByIdAndUpdate(req.user._id, user, { new: true }).exec();
        res.json({
            msg: 'Profile updated',
            user: {
                ...pick(user, editableFields)
            }
        });
    } catch (error) {
        winston.error('An error occurred updating the user profile', error);
        res.status(500).json({ msg: 'Server Error' });
    }
}

const changePassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);
        bcrypt.compare(oldPassword, user.password, async (err, result) => {
            if (result && !err) {
                user.password = newPassword;
                try {
                    await user.save();
                } catch (error) {
                    return res.status(400).json({
                        errors: [{ msg: 'New password validation failed' }]
                    });
                }
                return res.json({ msg: 'Password updated' });
            } else if (!err) {
                return res.status(400).json({
                    errors: [{ msg: 'Old password not correct' }]
                });
            }
            throw err;
        });
    } catch (error) {
        winston.error('An error occurred while changing the password', error);
        res.status(500).json({ msg: 'Server Error' });
    }
}

module.exports = {
    changePassword,
    getProfile,
    getProfileById,
    updateProfile
}