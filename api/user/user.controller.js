const { User } = require('./user.model');
const bcrypt = require('bcryptjs');

const getProfile = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user._id });
        res.json({
            user,
            success: !!user,
        });
    } catch (error) {
        console.log('An error occurred getting the user profile', error);
        res.status(400).send({ success: 0 });
    }
}

const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        bcrypt.compare(oldPassword, req.user.password, async (err, result) => {
            if (result && !err) {
                req.user.password = newPassword;
                await req.user.save();
                return res.status(200).send({ success: 1 });
            } else if (!err) {
                return res.status(400).send({ success: 0, incorrectPassword: true });
            } else {
                throw err;
            }
        });
    } catch (error) {
        console.log(`An error occurred changing the password against ${req.user._id}`, error);
        res.status(400).send({ success: 0 });
    }
}

const updateProfile = async (req, res) => {
    try {
        const newProfile = { ...req.body };

        if (newProfile.username) {
            const user = User.findOne({ username: newProfile.username, _id: { $ne: req.user._id } })
            if (user) {
                return res.status(400).send({
                    alreadyExists: 1,
                    username: !!user,
                    success: 0
                });
            }
        }

        delete newProfile['_id'];
        await User.updateOne({ _id: req.user._id }, newProfile);
        res.json({
            success: 1,
        });
    } catch (error) {
        console.log('An error occurred updating the user profile', error);
    }
}

module.exports = {
    changePassword,
    updateProfile,
    getProfile,
}