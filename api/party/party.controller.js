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
                    const party = await Party.findByIdAndUpdate(req.params.id, req.body).exec();
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
        const parties = await Party.find({ endDateTime: {$gt: new Date()} }).populate('createdBy').exec();
        res.json({
            msg: 'Parties fetched',
            parties
        });
    } catch (error) {
        winston.error('An error occurred while getting the parties', error);
        res.status(500).json({ msg: 'Server Error' });
    }
}

module.exports = {
    upsertParty,
    getParties
}