const general_functions = require("../general/general_functions.js");
const fs = require("fs");
const con = require("../../../connection.js");
const user_functions = require("../user/user_functions.js");
const logger = require("../../../logging.js");

async function get_notifications(session, ip) {
    try {
        const user_data = await user_functions.get_user_data(session, ip);

        if (user_data.status === "error") {
            return user_data;
        }

        const [get_notification_result] = await con.execute(
            "SELECT * FROM user_notifications WHERE notification_user = ? AND notification_seen = 0",
            [user_data.data.username]
        );


        return {
            status: "success",
            notifications: get_notification_result,
        };
    } catch (err) {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return {
            status: "error",
            data: "Failed to get notifications.",
        };
    }
}

async function set_notification(session, ip, notification_object) {
    try {
        const user_data = await user_functions.get_user_data(session, ip);

        if (user_data.status === "error") {
            return user_data;
        }

        const [set_notification_result] = await con.execute(
            "INSERT INTO user_notifications (notification_user, notification_json) VALUES (?, ?)",
            [user_data.data.username, JSON.stringify(notification_object)]
        );

        if (set_notification_result.affectedRows === 0) {
            return {
                status: "error",
                data: "Failed to set notification.",
            };
        }

        return {
            status: "success",
            data: "Successfully set notification.",
        };
    } catch (err) {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return {
            status: "error",
            data: "Failed to set notification.",
        };
    }
}

async function set_notification_for_user(username, notification_object) {
    try {

        const [set_notification_result] = await con.execute(
            "INSERT INTO user_notifications (notification_user, notification_json) VALUES (?, ?)",
            [username, JSON.stringify(notification_object)]
        );

        if (set_notification_result.affectedRows === 0) {
            return {
                status: "error",
                data: "Failed to set notification.",
            };
        }

        return {
            status: "success",
            data: "Successfully set notification.",
        };
    } catch (err) {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return {
            status: "error",
            data: "Failed to set notification.",
        };
    }
}

async function acknowledge_notification(session, ip, notification_id) {
    try {
        const user_data = await user_functions.get_user_data(session, ip);

        if (user_data.status === "error") {
            return user_data;
        }

        const [acknowledge_notification_result] = await con.execute(
            "UPDATE user_notifications SET notification_seen = 1 WHERE id = ? AND notification_user = ?",
            [notification_id, user_data.data.username]
        );

        if (acknowledge_notification_result.affectedRows === 0) {
            return {
                status: "error",
                data: "Failed to acknowledge notification.",
            };
        }

        return {
            status: "success",
            data: "Successfully acknowledged notification.",
        };
        
    } catch (err) {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return {
            status: "error",
            data: "Failed to acknowledge notification.",
        };
    }
}

const notification_object = {
    id: null,
    title: null,
    description: null,
    showImage: true,
    customImageSource: null,
    customButtonExists: false,
    customButtonText: null,
    customButtonLink: null
}

module.exports = {
    get_notifications,
    set_notification,
    acknowledge_notification,
    set_notification_for_user,
    notification_object
};