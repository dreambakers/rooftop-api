const express = require('express');
const router = express.Router();
const { check, checkSchema } = require('express-validator');
const ObjectID = require("mongodb").ObjectID;
const controller = require('./user.controller')
const authenticate = require('../../middleware/authenticate');
const handleFile = require('../../middleware/handle-file');
const constants = require('../../constants');

const Schema = {
    "tag": {
      in: 'body',
      optional: { options: { nullable: true } },
      isIn: {
        options: [constants.tags],
        errorMessage: `Invalid tag. Must be one of the following: ${constants.tags.join(', ')}`
      }
    },
    "cashAppProfileUrl": {
        in: 'body',
        optional: { options: { nullable: true } },
        isURL: {
          errorMessage: `cashAppProfileUrl must be a valid URL`
        }
    },
    "zelleProfileUrl": {
        in: 'body',
        optional: { options: { nullable: true } },
        isURL: {
          errorMessage: `zelleProfileUrl must be a valid URL`
        }
    },
    "spotifyProfileUrl": {
        in: 'body',
        optional: { options: { nullable: true } },
        isURL: {
          errorMessage: `spotifyProfileUrl must be a valid URL`
        }
    },
    "twitterProfileUrl": {
      in: 'body',
      optional: { options: { nullable: true } },
      isURL: {
        errorMessage: `twitterProfileUrl must be a valid URL`
      }
    },
    "instagramProfileUrl": {
        in: 'body',
        optional: { options: { nullable: true } },
        isURL: {
          errorMessage: `instagramProfileUrl must be a valid URL`
        }
    }
}

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
    .post('/', authenticate, handleFile('profilePicture', ['image/png','image/jpeg']), [
        checkSchema(Schema)
    ], controller.updateProfile)
    .post('/changePassword', [ authenticate, [
        check('oldPassword', 'Old password is required').exists(),
        check('newPassword', 'New password is required').exists()]
    ], controller.changePassword);

module.exports = router;