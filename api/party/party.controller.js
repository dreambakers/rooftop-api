const { validationResult } = require('express-validator');
const { Party } = require('./party.model');
const { User } = require('../user/user.model');
const winston = require('../../config/winston');
const constants = require('../../constants');
const ObjectID = require("mongodb").ObjectID;

const upsertParty = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Updating exisiting party
        if (req.params.id) {
            if (!ObjectID.isValid(req.params.id)) {
                return res.status(400).json({
                    errors: [{ msg: 'Invalid Party ID' }]
                });
            } else {
                try {
                    const party = await Party.findOneAndUpdate({
                        _id: req.params.id,
                        createdBy: req.user._id
                    }, req.body).exec();
                    if (!party) {
                        return res.status(400).json({
                            errors: [{ msg: 'No party found against provided ID' }]
                        });
                    }
                    return res.json({ msg: 'Party updated', party });
                } catch (error) {
                    winston.error("An error occurred while updating the party", error);
                    throw error;
                }
            }
        } 
        // Creating new party
        else {
            let party = new Party({...req.body, createdBy: req.user._id });
            party = await party.save();
            if (party) {
                await User.findByIdAndUpdate(req.user._id, { $push: { parties: party } }).exec();
                res.json({
                    msg: 'Party created',
                    party
                });
            }
        }
    } catch (error) {
        winston.error('An error occurred while creating the party', error);
        res.status(500).json({ msg: 'Server Error' });
    }
}

const getParties = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const filter = {};
        if (req.body.filter && Object.keys(req.body.filter).length) {
            for (let [key, value] of Object.entries(req.body.filter)) {
                if (isNaN(value) || typeof value === "boolean") {
                    filter[key] = value;
                } else {
                    filter[key] = { $lte: value }
                }
            }
        }
        const parties = await Party.find({ endDateTime: {$gt: new Date()}, type: constants.partyTypes.public, ...filter }).populate('createdBy ratings.by').exec();
        res.json({
            msg: 'Parties fetched',
            parties
        });
    } catch (error) {
        winston.error('An error occurred while getting the parties', error);
        res.status(500).json({ msg: 'Server Error' });
    }
}

const getMyParties = async (req, res) => {
    try {
        const parties = await Party.find({ endDateTime: {$gt: new Date()}, createdBy: req.user._id }).populate('createdBy ratings.by').exec();
        res.json({
            msg: 'Parties fetched',
            parties
        });
    } catch (error) {
        winston.error('An error occurred while getting the parties', error);
        res.status(500).json({ msg: 'Server Error' });
    }
}

const rateParty = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        if (!ObjectID.isValid(req.params.id)) {
            return res.status(400).json({
                errors: [{ msg: 'Invalid Party ID' }]
            });
        } 
        let party = await Party.findById(req.params.id).exec();
        if (!party) {
            return res.status(400).json({
                errors: [{ msg: 'No party found against provided ID' }]
            });
        }
        const newRating = {
            by: req.user._id,
            rating: req.body.rating,
            review: req.body.review
        };
        if (!party.ratings.length) {
            party.ratings.push(newRating);
        } else {
            const ratingIndex = party.ratings.findIndex(rating => rating.by.toString() === req.user._id);
            if (ratingIndex >= 0) {
                party.ratings[ratingIndex] = newRating;
            } else {
                party.ratings.push(newRating);
            }
        }
        party = await party.save();
        res.json({
            msg: 'Rating submitted',
            party
        });
    } catch (error) {
        winston.error('An error occurred while rating the party', error);
        res.status(500).json({ msg: 'Server Error' });
    }
}

const deleteParty = async (req, res) => {
    try {
        if (!ObjectID.isValid(req.params.id)) {
            return res.status(400).json({
                errors: [{ msg: 'Invalid Party ID' }]
            });
        } 
        const [ party, user ] = await Promise.all([
            Party.findOneAndDelete({
                _id: req.params.id,
                createdBy: req.user._id
            }).exec(),
            User.findByIdAndUpdate(req.user._id, {
                $pull: {
                    parties: new ObjectID(req.params.id)
                }
            }).exec()
        ]);
        if (!party) {
            return res.status(400).json({
                errors: [{ msg: 'No party found against provided ID' }]
            });
        }
        res.json({
            msg: 'Party deleted',
            party
        });
    } catch (error) {
        winston.error('An error occurred while deleting the party', error);
        res.status(500).json({ msg: 'Server Error' });
    }
}

module.exports = {
    upsertParty,
    getParties,
    getMyParties,
    rateParty,
    deleteParty
}