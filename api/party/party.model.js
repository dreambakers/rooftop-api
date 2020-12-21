const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const constants = require('../../constants');

const partySchema = new Schema({
    title: String,
    bourough: {
        type: String,
        enum : constants.bouroughs,
    },
    location: String,
    vibe: {
        type: String,
        enum : constants.vibes,
    },
    venueSize: {
        type: Number,
        min: constants.venueSize.min,
        max: constants.venueSize.max
    },
    crowdControl: {
        type: String,
        enum : constants.crowdControls
    },
    crowdCaution: { type: Boolean },
    price: Number,
    about: String,
    type: {
        type: String,
        enum: constants.partyTypes
    },
    shortId: String,
    startDateTime: Date,
    endDateTime: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
},{
    timestamps: true
});

// generating a non-duplicate Code
partySchema.pre('save', function(next){  
  let ctx = this;
  attempToGenerate(ctx, next);
});

function attempToGenerate(ctx, callback) {
    let newCode = generateBase58Id();
    ctx.constructor.findOne({'shortId': newCode}).then((party) => {
      if (party) {
        attempToGenerate(ctx, callback);
      }
      else {
        ctx.shortId = newCode;
        callback();
      }
    }, (err) => {
        callback(err);
    });
}

const generateBase58Id = () => {
    const alphabet = "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ"
    let output = "";

    for (let i = 0; i < 8; i ++) {
        const index = Math.floor(Math.random() * (alphabet.length - 1)) + 1;
        output = output + alphabet[index];
    }
    return output;
}

const Party = mongoose.model('Party', partySchema);
module.exports = { Party };