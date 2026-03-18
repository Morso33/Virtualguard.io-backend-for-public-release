const express = require('express');
const router = express.Router();
const general_functions = require('./general_functions.js');
const logger = require('../../../logging.js');
const config = require("../../../../config.json");

router.get('/discord', async (req, res) => {
    try
    {
        return res.redirect(config.links.discord);
    }
    catch
    {
        return res.send("Failed to redirect. Please press <a href='" + config.links.discord + "'>here</a>");
    }
});
router.get('/twitter', async (req, res) => {
    try
    {
        return res.redirect(config.links.twitter);
    }
    catch
    {
        return res.send("Failed to redirect. Please press <a href='" + config.links.twitter + "'>here</a>");
    }
});

module.exports = router;