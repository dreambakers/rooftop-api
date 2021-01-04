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
        if (req.body.partyId) {
            try {
                const party = await Party.findOneAndUpdate({
                    _id: req.body.partyId,
                    createdBy: req.user._id
                }, req.body, { new: true }).exec();
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

const getPartyById = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { shortId, partyId } = req.body;
        let party;
        if (shortId) {
            party = await Party.findOne({ shortId }).populate('createdBy ratings.by').exec();
        } else if (partyId) {
            party = await Party.findById(partyId).populate('createdBy ratings.by').exec();
        } else {
            return res.status(400).json({
                errors: [{ msg: 'shortId or partyId required to get party details' }]
            });
        }
        if (!party) {
            return res.status(400).json({
                errors: [{ msg: 'No party found against the provided ID' }]
            });
        }
        res.json({
            msg: 'Party fetched',
            party
        });
    } catch (error) {
        winston.error('An error occurred while getting the party', error);
        res.status(500).json({ msg: 'Server Error' });
    }
}

const getMyParties = async (req, res) => {
    try {
        const parties = await Party.find({ endDateTime: {$gt: new Date()}, createdBy: req.user._id }).populate('ratings.by').exec();
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
        let party = await Party.findById(req.body.partyId).exec();
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
            party.hotOrNot = newRating.rating;
        } else {
            const ratingIndex = party.ratings.findIndex(rating => rating.by.toString() === req.user._id);
            if (ratingIndex >= 0) {
                party.ratings[ratingIndex] = newRating;
            } else {
                party.ratings.push(newRating);
            }
            // Calculating hotOrNot
            if (party.ratings.length >= 2) {
                party.hotOrNot = party.ratings.reduce((ratingObj1, ratingObj2) => ratingObj1.rating + ratingObj2.rating) / party.ratings.length;
            } else {
                party.hotOrNot = newRating.rating;
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
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const [ party, user ] = await Promise.all([
            Party.findOneAndDelete({
                _id: req.body.partyId,
                createdBy: req.user._id
            }).exec(),
            User.findByIdAndUpdate(req.user._id, {
                $pull: {
                    parties: new ObjectID(req.body.partyId)
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
    getPartyById,
    getMyParties,
    rateParty,
    deleteParty
}