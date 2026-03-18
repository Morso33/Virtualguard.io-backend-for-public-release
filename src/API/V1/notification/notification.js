const express = require("express");
const router = express.Router();
const notification_functions = require("./notification_functions.js");
const general_functions = require("../general/general_functions.js");
const logger = require("../../../logging.js");

router.get("/get_notifications", async (req, res) => {

    try {
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);
        const get_notifications_result = await notification_functions.get_notifications(session, ip);

        if (get_notifications_result.status === "error") 
        {
            return res.json({status: "error",data: get_notifications_result.data, error_r: "get_notifications_error"});
        }
        else
        {
            return res.json({status: "success", data: get_notifications_result.notifications});
        }
    } 
    catch (err) {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        res.json({status: "error",data: "Internal server error.", error_r: "get_notifications_internal_error"});
    }
});

router.get("/acknowledge_notification", async (req, res) => {
    {
        
        try {
            const session = req.cookies._vg_session;
            const ip = general_functions.get_ip(req);
            const notification_id = req.query.notification_id;
            
            const acknowledge_notification_result = await notification_functions.acknowledge_notification(session,ip,notification_id);

            if (acknowledge_notification_result.status === "error") 
            {
                return res.json(acknowledge_notification_result);
            }
            
            res.json({status: "success", data: acknowledge_notification_result});
        } 
        catch (err) {
            logger.log(logger.LOGTYPE.ERROR, err.stack);
            res.json({status: "error", data: "Internal server error.", error_r: "acknowledge_notification_internal_error"});
        }
    }
});

module.exports = router;