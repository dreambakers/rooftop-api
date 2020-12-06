const express = require('express');
const router = express.Router();

const user = require("../api/user/user.index");
const auth = require("../api/auth/auth.index");

router
    .use('/auth', auth)
    .use('/user', user)

module.exports = router;