const express = require('express');
const router = express.Router();
const con = require('../../../connection.js');
const bcrypt = require("bcryptjs")
const user_functions = require("../user/user_functions.js")
const path = require('path');
const general_functions = require('../general/general_functions.js');
const logger = require('../../../logging.js');
const fs = require('fs');
const os = require('os');
const si = require('systeminformation');
const config = require("../../../../config.json");
const {exec, execSync} = require('child_process');

router.get("/", async (req, res) => {
    try
    {
        const page = req.query.page;
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);
        
        if (!session)
        {
            return res.redirect("/error/403?reason=No user logon");
        }
        
        const is_admin = await user_functions.is_admin(session, ip);
        const is_support = await user_functions.is_support(session, ip);
        if (!is_admin && !is_support)
        {
            return res.redirect("/error/403?reason=No permission to access this admin-only page");
        }
        else
        {
            switch (page)
            {
                case "admin_general":
                res.sendFile(path.join(__dirname, '/admin_panel.html'));
                break;
                case "admin_users":
                res.sendFile(path.join(__dirname, '/admin_users.html'));
                break;
                case "admin_tickets":
                res.sendFile(path.join(__dirname, '/admin_tickets.html'));
                break;
                case "admin_statistics":
                res.sendFile(path.join(__dirname, '/admin_statistics.html'));
                break;
                case "admin_view_user":
                res.sendFile(path.join(__dirname, '/admin_view_user.html'));
                break;
                default:
                res.sendFile(path.join(__dirname, '/admin_panel.html'));
                break;
            }
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.json({ status: "error", error: "Internal server error", error_r: "admin_authenticate_internal_error" });
    }
});

router.get("/admin_frontend.js", async (req, res) => {
    try
    {
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);
        const is_admin = await user_functions.is_admin(session, ip);
        const is_support = await user_functions.is_support(session, ip);
        if (!is_admin && !is_support)
        {
            return res.json({status: "error", error: "Unable to verify authentication", error_r: "admin_authenticate_failure"});
        }
        else
        res.sendFile(path.join(__dirname, '/admin_frontend.js'));
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.json({ status: "error", error: "Internal server error", error_r: "admin_authenticate_internal_error" });
    }
});

router.get("/user_statistics", async (req, res) => {
    try
    {
        
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);
        const is_admin = await user_functions.is_admin(session, ip);
        if (!is_admin)
        {
            return res.json({status: "error", error: "Unable to verify authentication", error_r: "admin_authenticate_failure"});
        }
        else
        {
            const [result_user_signup_periods] = await con.query("SELECT COUNT(*) AS `total_users`, (SELECT COUNT(*) FROM `users` WHERE `created_at` >= DATE_SUB(NOW(), INTERVAL 1 DAY)) AS `users_24h`, (SELECT COUNT(*) FROM `users` WHERE `created_at` >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS `users_7d`, (SELECT COUNT(*) FROM `users` WHERE `created_at` >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS `users_30d`, (SELECT COUNT(*) FROM `users` WHERE `created_at` >= DATE_SUB(NOW(), INTERVAL 365 DAY)) AS `users_365d` FROM `users`");
            const [result_user_signup_timestamps] = await con.query("SELECT `created_at` FROM `users` LIMIT 1000");
            return res.json({status: "success", signup_periods: result_user_signup_periods, signup_timestamps: result_user_signup_timestamps});
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.json({ status: "error", error: "Internal server error", error_r: "admin_authenticate_internal_error" });
    }
});

router.get("/ticket_list", async (req, res) => {
    try
    {
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);
        const page = req.query.ticket_page ? req.query.ticket_page : 0;
        const category = req.query.ticket_category ? req.query.ticket_category : "%";
        
        const is_admin = await user_functions.is_admin(session, ip);
        const is_support = await user_functions.is_support(session, ip);
        const is_staff = (is_admin || is_support)
        if (!is_staff)
        {
            return res.json({status: "error", error: "Unable to verify authentication", error_r: "admin_authenticate_failure"});
        }
        else
        {
            const [tickets_amount] = await con.query("SELECT COUNT(*) FROM `ticket_threads`");
            
            const [result_tickets] = await con.query("SELECT `id`, `title`, `replies`, `created_at`, `updated_at`, `state`, `assigned_to`, `category` FROM `ticket_threads` WHERE `category` LIKE ? ORDER BY `id` DESC LIMIT 100 OFFSET ?", [category, page * 100]);
            return res.json({status: "success", tickets: result_tickets, tickets_amount: tickets_amount[0]["COUNT(*)"]});
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.json({ status: "error", error: "Internal server error", error_r: "admin_authenticate_internal_error" });
    }
});

router.get("/get_all_users", async (req, res) => {
    try
    {
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);
        
        const is_admin = await user_functions.is_admin(session, ip);
        if (!is_admin)
        {
            return res.json({status: "error", error: "Unable to verify authentication", error_r: "admin_authenticate_failure"});
        }
        else
        {
            const [result_users] = await con.query("SELECT `id`, `username`, `session_ip`, `created_at`, `is_banned`, `license_type`, `total_files_protected`, `session_ip` FROM `users` ORDER BY `id` DESC");
            return res.json({status: "success", users: result_users});
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.json({ status: "error", error: "Internal server error", error_r: "admin_authenticate_internal_error" });
    }
});

router.get("/get_user", async (req, res) => {
    try
    {
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);
        const user_id = req.query.user_id;
        
        const is_admin = await user_functions.is_admin(session, ip);
        if (!is_admin)
        {
            return res.json({status: "error", error: "Unable to verify authentication", error_r: "admin_authenticate_failure"});
        }
        else
        {
            const [result_user] = await con.query("SELECT `id`, `username`, `session_ip`, `created_at`, `is_banned`, `license_type`, `total_files_protected`, `session_ip` FROM `users` WHERE `id` = ?", [user_id]);
            return res.json({status: "success", user: result_user[0]});
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.json({ status: "error", error: "Internal server error", error_r: "admin_authenticate_internal_error" });
    }
});


router.get("/run_action", async (req, res) => {
    try
    {
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);
        const user_id = req.query.user_id;
        const action = req.query.action;
        
        const is_admin = await user_functions.is_admin(session, ip);
        if (!is_admin)
        {
            return res.json({status: "error", error: "Unable to verify authentication", error_r: "admin_authenticate_failure"});
        }
        else
        {
            switch (action)
            {
                case "ban":
                const [result_ban] = await con.query("UPDATE `users` SET `is_banned` = 1 WHERE `id` = ?", [user_id]);
                result_ban.affectedRows ? res.json({status: "success"}) : res.json({status: "error", error: "Unable to ban user", error_r: "admin_ban_user_error"});
                break;
                case "unban":
                const [result_unban] = await con.query("UPDATE `users` SET `is_banned` = 0 WHERE `id` = ?", [user_id]);
                result_unban.affectedRows ? res.json({status: "success"}) : res.json({status: "error", error: "Unable to unban user", error_r: "admin_unban_user_error"});
                break;
                case "force_license_0":
                const [result_force_license_0] = await con.query("UPDATE `users` SET `license_type` = 0 WHERE `id` = ?", [user_id]);
                result_force_license_0.affectedRows ? res.json({status: "success"}) : res.json({status: "error", error: "Unable to force license type", error_r: "admin_force_license_type_error"});
                break;
                case "force_license_1":
                const [result_force_license_1] = await con.query("UPDATE `users` SET `license_type` = 1 WHERE `id` = ?", [user_id]);
                result_force_license_1.affectedRows ? res.json({status: "success"}) : res.json({status: "error", error: "Unable to force license type", error_r: "admin_force_license_type_error"});
                break;
                case "force_license_2":
                const [result_force_license_2] = await con.query("UPDATE `users` SET `license_type` = 2 WHERE `id` = ?", [user_id]);
                result_force_license_2.affectedRows ? res.json({status: "success"}) : res.json({status: "error", error: "Unable to force license type", error_r: "admin_force_license_type_error"});
                break;
                case "reset_password":
                const new_password = general_functions.random_string(8);
                const salt = await bcrypt.genSalt(10);
                const hashed_password = await bcrypt.hash(new_password, salt);
                const [result_reset_password] = await con.query("UPDATE `users` SET `password_bcrypt` = ? WHERE `id` = ?", [hashed_password, user_id]);
                result_reset_password.affectedRows ? res.json({status: "success", new_password: new_password}) : res.json({status: "error", error: "Unable to reset password", error_r: "admin_reset_password_error"});
                break;
                case "invalidate_session":
                const [result_invalidate_session] = await con.query("UPDATE `users` SET `session_token` = NULL, `session_ip` = NULL WHERE `id` = ?", [user_id]);
                result_invalidate_session.affectedRows ? res.json({status: "success"}) : res.json({status: "error", error: "Unable to invalidate session", error_r: "admin_invalidate_session_error"});
                break;
            }
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.json({ status: "error", error: "Internal server error", error_r: "admin_authenticate_internal_error" });
    }
});

router.get("/get_request_data", async (req, res) => {
    try
    {
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);
        
        const is_admin = await user_functions.is_admin(session, ip);
        if (!is_admin)
        {
            return res.json({status: "error", error: "Unable to verify authentication", error_r: "admin_authenticate_failure"});
        }
        else
        {
            //All requests that are less than a year old, limited to 100 000
            const minTime = Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 365;
            const [result_request] = await con.query("SELECT `id`, `ip`, `request_url`, `request_params`, `request_trust_score`, `request_detections`, `request_timestamp` FROM `requests_log` WHERE request_timestamp >= ? ORDER BY `id` DESC LIMIT 100000", [minTime]);
            return res.json({status: "success", requests: result_request});
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.json({ status: "error", error: "Internal server error", error_r: "admin_authenticate_internal_error" });
    }
});

router.get("/set_maintenance", async (req, res) => {
    try
    {
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);
        
        const is_admin = await user_functions.is_admin(session, ip);
        if (!is_admin)
        {
            return res.json({status: "error", error: "Unable to verify authentication", error_r: "admin_authenticate_failure"});
        }
        else
        {
            general_functions.set_site_maintenance("Admin panel");
            return res.json({status: "success"});
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.json({status: "error", error: "Internal server error", error_r: "admin_authenticate_internal_error"});
    }
});

router.get("/unset_maintenance", async (req, res) => {
    try
    {
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);
        
        const is_admin = await user_functions.is_admin(session, ip);
        if (!is_admin)
        {
            return res.json({status: "error", error: "Unable to verify authentication", error_r: "admin_authenticate_failure"});
        }
        else
        {
            general_functions.unset_site_maintenance();
            return res.json({status: "success"});
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.json({status: "error", error: "Internal server error", error_r: "admin_authenticate_internal_error"});
    }
});

router.get("/get_runtime_log", async (req, res) => {
    try
    {
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);
        
        const is_admin = await user_functions.is_admin(session, ip);
        if (!is_admin)
        {
            return res.json({status: "error", error: "Unable to verify authentication", error_r: "admin_authenticate_failure"});
        }
        else
        {
            //Get the runtime log
            const runtime_log = fs.readFileSync("./logs/runtime.log", "utf8");
            //Format newlines for HTML
            runtime_log.replace(/\n/g, "<br>");
            return res.json({status: "success", runtime_log: runtime_log});
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.json({status: "error", error: "Internal server error", error_r: "admin_authenticate_internal_error"});
    }
});

router.get("/get_server_info", async (req, res) => {
    try
    {
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);

        const is_admin = await user_functions.is_admin(session, ip);
        if (!is_admin)
        {
            return res.json({status: "error", error: "Unable to verify authentication", error_r: "admin_authenticate_failure"});
        }
        else
        {
            const deployment = config.env;

            const currentLoad = await si.currentLoad();
            const mem = await si.mem();
            const osInfo = await si.osInfo();

            const current_load = currentLoad.currentLoad;

            const total_memory = mem.total;
            const used_memory = mem.used;
            const used_memory_percentage = (used_memory / total_memory) * 100;

            const OS = osInfo.distro + " " + osInfo.release;
            const upTime = os.uptime();
            const serverTime = Date.now() / 1000;

            const nodeVersion = process.version;

            const upTimeFormatted = (upTime / 60 / 60 / 24).toFixed(0) + " days, " + (upTime / 60 / 60 % 24).toFixed(0) + " hours, " + (upTime / 60 % 60).toFixed(0) + " minutes, " + (upTime % 60).toFixed(0) + " seconds";

            return res.json({status: "success", current_cpu: current_load, used_memory_percentage: used_memory_percentage, OS: OS, up_time: upTimeFormatted, server_time: serverTime, node_version: nodeVersion, deployment: deployment});
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.json({status: "error", error: "Internal server error", error_r: "admin_authenticate_internal_error"});
    }
});

router.get("/restart_server", async (req, res) => {
    try
    {
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);

        const is_admin = await user_functions.is_admin(session, ip);
        if (!is_admin)
        {
            return res.status(403).send("Unable to verify authentication");
        }
        else
        {
            res.json({status: "success"});
            //Exit gracefully
            process.exit(6000);
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.status(500).send("Internal server error");
    }
});

router.get("/hard_restart_server", async (req, res) => {
    try
    {
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);

        const is_admin = await user_functions.is_admin(session, ip);
        if (!is_admin)
        {
            return res.status(403).send("Unable to verify authentication");
        }
        else
        {
            if (config.env != "prod")
            {
                return res.status(403).send("Unable to hard restart server in non-production environment");
            }
            else
            {
                execSync("sudo reboot now");
                res.json({status: "success"});
            }
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.status(500).send("Internal server error");
    }
});


module.exports = router;