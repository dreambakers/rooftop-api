const express = require('express');
const moment = require('moment');
const router = express.Router();
const { check, checkSchema } = require('express-validator');
const controller = require('./party.controller')
const constants = require('../../constants');
const authenticate = require('../../middleware/authenticate');
const handleFile = require('../../middleware/handle-file');

const Schema = {
    "bourough": {
      in: 'body',
      isIn: {
        options: [constants.bouroughs],
        errorMessage: `Invalid Bourough. Must be one of the following: ${constants.bouroughs.join(', ')}`
      }
    },
    "crowdControl": {
        in: 'body',
        isIn: {
          options: [constants.crowdControls],
          errorMessage: `Invalid crowd control. Must be one of the following: ${constants.crowdControls.join(', ')}`
        }
    },
    "type": {
        in: 'body',
        isIn: {
          options: [Object.values(constants.partyTypes)],
          errorMessage: `Invalid party type. Must be one of the following: ${Object.values(constants.partyTypes).join(', ')}`
        }
    },
    "endDateTime": {
      custom: {
        options: (value) => {
          return value && moment(value, moment.ISO_8601).isValid()
        },
        errorMessage: "End date time should be valid"
      }
    },
    "startDateTime": {
      custom: {
        options: (value, { req }) => {
          if (!moment(value, moment.ISO_8601).isValid()) {
            return false;
          } else {
            return moment(value).isAfter(moment()) && moment(value).isBefore(moment(req.body.endDateTime))
          }
        },
        errorMessage: "Start date time should be valid, less than the end date time and should not be in the past"
      }
    }
}

router
    .post('/:id?', [ authenticate, handleFile('cover', ['image/png','image/jpeg']), [
        check('title', 'Title is required').exists(),
        check('location', 'Location is required').exists(),
        check('price', 'Price must be a number').isNumeric(),
        check('about', 'About is required').exists(),
        check('crowdCaution', 'Crowd caution must be a boolean').isBoolean(),
        check('vibe', 'Vibe must be a valid URL').isURL(),
        check('venueSize', `Venue size must be a number between ${constants.venueSize.min} and ${constants.venueSize.max}`)
            .isInt({ min: constants.venueSize.min, max: constants.venueSize.max }),
        checkSchema(Schema)
      ]
    ], controller.upsertParty)
    .get('/', [
      check('filter.venueSize', `Venue size must be a number between ${constants.venueSize.min} and ${constants.venueSize.max}`).optional()
          .isInt({ min: constants.venueSize.min, max: constants.venueSize.max }),
      check('filter.price', 'Price must be a number').optional().isNumeric(),
      check('filter.crowdCaution', 'Crowd caution must be a boolean').optional().isBoolean(),
      checkSchema({
        "filter.bourough": {
          optional: { options: { nullable: true } },
          isIn: {
            options: [constants.bouroughs],
            errorMessage: `Invalid Bourough. Must be one of the following: ${constants.bouroughs.join(', ')}`
          }
        },
        "filter.crowdControl": {
          optional: { options: { nullable: true } },
          isIn: {
            options: [constants.crowdControls],
            errorMessage: `Invalid crowd control. Must be one of the following: ${constants.crowdControls.join(', ')}`
          }
        },
      })
    ], controller.getParties)
    .get('/my/', authenticate, controller.getMyParties)
    .post('/rate/:id', [
      authenticate, [
        check('rating', 'Rating must be an int between 1 and 5').isInt({ min: 1, max: 5 }),
      ]
    ], controller.rateParty)
    .delete('/:id', authenticate, controller.deleteParty);

module.exports = router;