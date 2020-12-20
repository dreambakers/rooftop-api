const express = require('express');
const router = express.Router();

const user = require("../api/user/user.index");
const auth = require("../api/auth/auth.index");
const party = require("../api/party/party.index");

router
    .use('/auth', auth)
    .use('/user', user)
    .use('/party', party)

module.exports = router;