const moment = require('moment');

const calculateHotOrNot = (user) => {
    if (user.parties.length) {
        const endedParties = user.parties.filter(party => moment(party.endDateTime).isBefore(moment()));

        let accumulatedRatings = 0;
        let ratedPartiesCount = 0;

        for (let party of endedParties) {
            if (party.hotOrNot) {
                ratedPartiesCount++;
                accumulatedRatings += party.hotOrNot;
            }
        }

        return accumulatedRatings ? ( accumulatedRatings / ratedPartiesCount ) : 0;
    }
}

module.exports = {
    calculateHotOrNot
}