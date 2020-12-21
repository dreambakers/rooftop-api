const { validationResult } = require('express-validator');
const { Party } = require('./party.model');
const winston = require('../../config/winston');
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

            res.json({
                msg: 'Party created',
                party
            });
        }
    } catch (error) {
        winston.error('An error occurred while creating the party', error);
        res.status(500).json({ msg: 'Server Error' });
    }
}

const getParties = async (req, res) => {
    try {
        const parties = await Party.find({ endDateTime: {$gt: new Date()} }).populate('createdBy ratings.by').exec();
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
        const newRating = {
            by: req.user._id,
            rating: req.body.rating,
            review: req.body.review
        };

        if (!party) {
            return res.status(400).json({
                errors: [{ msg: 'No party found against provided ID' }]
            });
        }

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

module.exports = {
    upsertParty,
    getParties,
    getMyParties,
    rateParty
}