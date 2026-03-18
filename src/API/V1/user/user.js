const express = require('express');
const router = express.Router();
const con = require('../../../connection.js');
const bcrypt = require("bcryptjs")
const user_functions = require('./user_functions.js');
const logger = require('../../../logging.js');
const general_functions = require('../general/general_functions.js');
const geoip = require('geoip-lite');
const captcha = require('../general/captcha.js');

router.get("/authenticate", async (req, res) => {
    try
    {
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);
        if (!session)
        {
            return res.json({ status: "error", error: "No session found", error_r: "authenticate_no_session" });
        }
        //user_functions.authorize
        const auth_result = await user_functions.authorize(session, ip);
        if (auth_result.status === "error")
        {
            return res.json({ status: "error", error: auth_result.error, error_r: auth_result.error_r });
        }
        return res.json({ status: "success", message: "User authenticated" });       
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.json({ status: "error", error: "Internal server error", error_r: "authenticate_internal_error" });
    }
});

router.post('/register', async (req, res) => {
    try
    {
        const username = req.body.username;
        const password = req.body.password;
        
        if (!username || !password) 
        {
            return res.json({ status: "error", error: 'Missing ' + (!username ? "username" : "password"), error_r: "register_missing_" + (!username ? "username" : "password") });
        }
        //CAPTCHA
        const captcha_response = req.body.captcha_response;
        const captcha_status = await captcha.validate_recaptcha_v2(captcha_response);
        if (captcha_status == false)
        {
            return res.json({ status: "error", error: "Invalid captcha", error_r: "register_invalid_captcha" });
        }
        
        if (await user_functions.username_exists(username))
        {
            return res.json({ status: "error", error: "Username already exists", error_r: "register_username_exists" });
        }
        
        const password_bcrypt = bcrypt.hashSync(password, 8);
        const [result] = await con.execute("INSERT INTO users (username, password_bcrypt, created_at) VALUES(?,?,?)", [username, password_bcrypt, Date.now() / 1000]);
        if (result.affectedRows === 1) {
            return res.json({ status: "success", message: "User registered" });
        } 
        else 
        {
            return res.json({ status: "error", error: "Unable to register account", error_r: "register_unable_to_register" });
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.status(500).json({ status: "error", error: "Internal server error", error_r: "register_internal_error" });
    }
});

router.post('/login', async (req, res) => {
    try
    {
        const username = req.body.username;
        const password = req.body.password;
        const rememberUser = req.body.rememberUser;
        const ip = general_functions.get_ip(req);
        const geoDataCountry = geoip.lookup(ip) ? geoip.lookup(ip).country : "XX";
        
        
        if (!username || !password) 
        {
            return res.json({ status: "error", error: 'Missing ' + (!username ? "username" : "password"), error_r: "login_missing_" + (!username ? "username" : "password") });
        }
        //Attempt to create a session
        intialize_session_result = await user_functions.initalize_session(username, password, ip);
        if (intialize_session_result.status === "error")
        {
            return res.json(intialize_session_result);
        }
        //Status is OK; generate session.
        const session_token = intialize_session_result.session_token;
        //Set cookies depending on rememberUser
        if (rememberUser)
        {
            res.cookie("_vg_session", session_token, { httpOnly: true, sameSite: true, maxAge: 1000 * 60 * 60 * 24 * 7 }); //valid for one week
            res.cookie("_vg_logged_in", "true", { httpOnly: false, sameSite: true, maxAge: 1000 * 60 * 60 * 24 * 7 }); //valid for one week
            res.cookie("_vg_country_code", geoDataCountry, { httpOnly: false, sameSite: true, maxAge: 1000 * 60 * 60 * 24 * 7 }); //valid for one week
            if (intialize_session_result.is_staff == true)
            {
                res.cookie("_vg_is_admin", "true", { httpOnly: false, sameSite: true, maxAge: 1000 * 60 * 60 * 24 * 7 }); //valid for one week
            }
        }
        else
        {
            res.cookie("_vg_session", session_token, { httpOnly: true, sameSite: true });
            res.cookie("_vg_logged_in", "true", { httpOnly: false, sameSite: true });
            res.cookie("_vg_country_code", geoDataCountry, { httpOnly: false, sameSite: true });
            if (intialize_session_result.is_staff == true)
            {
                res.cookie("_vg_is_admin", "true", { httpOnly: false, sameSite: true });
            }
        }
        
        return res.json({ status: "success"});
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.status(500).json({ status: "error", error: "Internal server error", error_r: "login_internal_error" });
    }
});

router.get('/logout', async (req, res) => {
    try
    {
        const session = req.cookies._vg_session;
        await user_functions.destroy_session(session);
        res.clearCookie("_vg_session");
        res.clearCookie("_vg_logged_in");
        return res.redirect("/p/login?message=You have been logged out");
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.status(500).json({ status: "error", error: "Internal server error", error_r: "logout_internal_error" });
    }
});


router.get('/get_user_projects', async (req, res) => {
    try
    {
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);
        
        //Get the projects by user
        const get_projects_by_user_result = await user_functions.get_projects_by_user(session, ip);
        if (get_projects_by_user_result.status === "error")
        {
            return res.json(get_projects_by_user_result);
        }
        //Get user data
        const get_user_data_result = await user_functions.get_user_data(session, ip);
        if (get_user_data_result.status === "error")
        {
            return res.json(get_user_data_result);
        }
        return res.json({ status: "success", data: get_projects_by_user_result.data, total_files_protected : get_user_data_result.data.total_files_protected, license_type: get_user_data_result.data.license_type, license_expiry: get_user_data_result.data.license_expiry });
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.status(500).json({ status: "error", error: "Internal server error", error_r: "get_user_projects_internal_error" });
    }
});

router.get("/get_username", async (req, res) => {
    try
    {
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);
        
        const get_user_data_result = await user_functions.get_user_data(session, ip);
        if (get_user_data_result.status === "error")
        {
            return res.json(get_user_data_result);
        }
        return res.json({ status: "success", username: get_user_data_result.data.username });
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.status(500).json({ status: "error", error: "Internal server error", error_r: "get_username_internal_error" });
    }
});

router.post("/request_password_reset", async (req, res) => {
    try
    {
        const username = req.body.username;
        if (!username)
        {
            return res.json({ status: "error", error: "Missing username", error_r: "request_password_reset_missing_username" });
        }
        const request_password_reset_result = await user_functions.client_request_password_reset(username);
        if (request_password_reset_result.status === "error")
        {
            return res.json(request_password_reset_result);
        }
        return res.json({ status: "success", data: "Password reset email sent" });
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.json({ status: "error", error: "Internal server error", error_r: "request_password_reset_internal_error" });
    }
});

router.post("/client_password_reset_with_token", async (req, res) => {
    try
    {
        const token = req.body.reset_token;
        const newPassword = req.body.password;
        if (!token)
        {
            return res.json({ status: "error", error: "Missing token", error_r: "client_password_reset_with_token_missing_token" });
        }
        //Call the function
        const client_password_reset_with_token_result = await user_functions.reset_client_password(token, newPassword);
        if (client_password_reset_with_token_result.status === "error")
        {
            return res.json(client_password_reset_with_token_result);
        }
        return res.json({ status: "success", data: "Your password was reset succesfully" });
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.send("Internal server error");
    }
});

router.get("/get_license", async (req, res) => {
    try
    {
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);
        
        const user_data_result = await user_functions.get_user_data(session, ip);
        if (user_data_result.status === "error")
        {
            return res.json(user_data_result);
        }
        return res.json({ status: "success", data: user_data_result.data.license_type });
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.send("Internal server error");
    }
});

module.exports = router;