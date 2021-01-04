const express = require('express');
const router = express.Router();
const { check, checkSchema } = require('express-validator');
const ObjectID = require("mongodb").ObjectID;
const controller = require('./user.controller')
const authenticate = require('../../middleware/authenticate');
const handleFile = require('../../middleware/handle-file');

router
    .get('/', authenticate, controller.getProfile)
    .post('/id/', [
        checkSchema({
            "userId": {
                custom: {
                  options: (value) => ObjectID.isValid(value),
                  errorMessage: "User ID should be valid"
                }
            }
        })
    ], controller.getProfileById)
    .post('/', authenticate, handleFile('profilePicture', ['image/png','image/jpeg']), controller.updateProfile)
    .post('/changePassword', [ authenticate, [
        check('oldPassword', 'Old password is required').exists(),
        check('newPassword', 'New password is required').exists()]
    ], controller.changePassword);

module.exports = router;