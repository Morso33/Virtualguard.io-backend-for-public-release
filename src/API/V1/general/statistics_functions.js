"use strict";
const con = require('../../../connection.js');
const logger = require('../../../logging.js');
const general_functions = require('./general_functions.js');

async function log_request(request, request_trust)
{
    const ignored_file_endings = [".css", ".js", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".woff", ".woff2", ".ttf", ".eot", ".otf", ".favicon"];

    if (ignored_file_endings.some(ending => request.originalUrl.endsWith(ending)))
    {
        return;
    }

    const [result] = await con.execute ("INSERT INTO `requests_log` (`ip`, `request_url`, `request_params`, `request_trust_score`, `request_detections`, `request_timestamp`) VALUES (?, ?, ?, ?, ?, ?);", [general_functions.get_ip(request), request.originalUrl.split("?")[0], JSON.stringify(request.query), request_trust.score, JSON.stringify(request_trust.detections), Math.floor(Date.now() / 1000)]);
    if (result.affectedRows !== 1)
    {
        logger.log("Failed to log request.", logger.LOGTYPE.WARNING);
    }
}

module.exports = {
    log_request
};