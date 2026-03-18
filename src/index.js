"use strict";
const express = require("express");
const path = require('path');
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload');
const logger = require("./logging.js");
const config = require("../config.json");
const general_functions = require("./API/V1/general/general_functions.js");
const statistics_functions = require("./API/V1/general/statistics_functions.js");

//Intialize express
const app = express();

// For parsing application/json
app.use(express.json());
// For parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
//For parsing cookies
app.use(cookieParser());
//For parsing files
app.use(fileUpload({
    limits: {
        // 100 MB
        fileSize: 100 * 1024 * 1024
    },
    abortOnLimit: true
}));

//Process request
app.use((req, res, next) => {
    try
    {
        //Run the Request Trust Algorithm.
        const request_trust = general_functions.determine_request_trust(req);
        //Is the request Direct Access?
        if (request_trust.isDirectAccess && config.env === "prod")
        {
            //return res.send("Refusal..." + general_functions.random_string(10)); //TODO: Reapply after mito redirects traffic.
        }
        //The request will be logged, this is async.
        statistics_functions.log_request(req, request_trust);    
        //Verify site is not in maintenance mode
        if (config.maintenance)
        {
            //allow if admin, file is css, or file is js
            if (!req.originalUrl.startsWith("/admin") && !req.originalUrl.endsWith(".css") && !req.originalUrl.endsWith(".js"))
            {
                return res.sendFile(path.join(__dirname, '/public/error/maintenance/index.html'));
            }
        }    
        next();
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.send("We were unable to process your request. Please try again later.");
    }
});

//Static middleware
app.use(express.static('public', { extensions: ['html'] }));
//Setup endpoints
const endpoint_user = require ("../src/API/V1/user/user.js");
const endpoint_ticket = require ("../src/API/V1/ticket/ticket.js");
const endpoint_engine = require ("../src/API/V1/engine/engine.js");
const endpoint_admin = require ("../src/API/V1/admin/admin.js");
const endpoint_redirects = require ("../src/API/V1/general/redirects.js");
const endpoint_notification = require ("../src/API/V1/notification/notification.js");
const endpoint_hooks = require ("../src/API/V1/hooks/hooks.js");

//Initialize endpoints
app.use('/API/V1/user', endpoint_user);
app.use('/API/V1/ticket', endpoint_ticket);
app.use('/API/V1/engine', endpoint_engine);
app.use('/admin', endpoint_admin);
app.use('/link', endpoint_redirects);
app.use('/API/V1/notification', endpoint_notification);
app.use('/API/V1/hooks', endpoint_hooks);


//Handle 404
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, '/public/error/404/index.html'));
});

switch (config.env)
{
    case "dev":
    app.listen(3000, () => {logger.log(logger.LOGTYPE.INFO, "env: Development (" + 3000 + ")");});
    break;
    case "prod":
    app.listen(80, () => {logger.log(logger.LOGTYPE.INFO, "env: Production (" + 80 + ")");});
    break;
    default:
    logger.log(logger.LOGTYPE.ERROR, "env: Unknown, killing...");
    process.exit(1);
    break;
}