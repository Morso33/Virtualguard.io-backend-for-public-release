const con = require('../../../connection.js');
const bcrypt = require("bcryptjs")
const user_functions = require('../user/user_functions.js');
const logger = require('../../../logging.js');
const notification_functions = require('../notification/notification_functions.js');


async function create_ticket(session, ip, title, content, category)
{
    try
    {
        const user_data = await user_functions.get_user_data(session, ip);
        if (user_data.status === "error")
        {
            return user_data;
        }
        
        const [result] = await con.execute("INSERT INTO ticket_threads (id, owned_by, title, content, replies, created_at, updated_at, assigned_to, state, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [null, user_data.data.username, title, content, 0, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000), null, "Awaiting staff assignment", category]);
        if (result.affectedRows === 1)
        {
            return {status: "success", id: result.insertId};
        }
        else
        {
            return {status: "error", error: "Internal server error", error_r: "create_ticket_internal_error"};
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return {status: "error", error: "Internal server error", error_r: "create_ticket_internal_error"};
    }
} 

async function reply_ticket(session, ip, content, ticket_id)
{
    try
    {
        const user_data = await user_functions.get_user_data(session, ip);
        if (user_data.status === "error")
        {
            return user_data;
        }

        const ticket_access = await has_ticket_access(session, ip, ticket_id);

        if (ticket_access.status === "error")
        {
            return ticket_access;
        }

        const is_admin = await user_functions.is_admin(session, ip);
        const is_support = await user_functions.is_support(session, ip);
        const is_staff = (is_admin || is_support);

        const [result] = await con.execute("INSERT INTO ticket_replies (reply_to, is_admin_reply, content, reply_user, reply_time) VALUES (?, ?, ?, ?, ?)", [ticket_id, (is_staff ? 1 : 0), content, user_data.data.username, Math.floor(Date.now() / 1000)]);
        if (result.affectedRows === 1)
        {
            await con.execute("UPDATE ticket_threads SET replies = replies + 1, updated_at = ? WHERE id = ?", [(Date.now() / 1000), ticket_id]);

            if (is_staff)
            {
                await con.execute("UPDATE ticket_threads SET state = ?, assigned_to = ? WHERE id = ?", ["Awaiting user reply", user_data.data.username, ticket_id]);

                //Create a notification for the user who owns the ticket.
                const [get_ticket_data] = await con.execute("SELECT * FROM ticket_threads WHERE id = ?", [ticket_id]);
                const notification_object = notification_functions.notification_object;
                notification_object.id = "ticket_reply";
                notification_object.title = "New Ticket Reply";
                notification_object.description = "Hello, " + get_ticket_data[0].owned_by + "\r\n\r\n Your ticket, \"" + get_ticket_data[0].title + "\" has been replied to by a staff member.\r\n\r\nPlease click the button below to view your ticket.";
                notification_object.showImage = true;
                notification_object.image = "";
                notification_object.customButtonExists = true;
                notification_object.customButtonText = "View ticket";
                notification_object.customButtonLink = "/p/panel/ticket?id=" + ticket_id;

                const set_notification_result = await notification_functions.set_notification_for_user(get_ticket_data[0].owned_by, notification_object);

                if (set_notification_result.status === "error")
                {
                    logger.log(logger.LOGTYPE.ERROR, set_notification_result.error);
                }
            }
            else
            {
                await con.execute("UPDATE ticket_threads SET state = ? WHERE id = ?", ["Awaiting staff reply", ticket_id]);
            }

            return {status: "success"};
        }
        else
        {
            return {status: "error", error: "Internal server error", error_r: "reply_ticket_internal_error"};
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return {status: "error", error: "Internal server error", error_r: "reply_ticket_internal_error"};
    }
}

async function close_ticket(session, ip, ticket_id)
{
    try
    {
        const user_data = await user_functions.get_user_data(session, ip);
        if (user_data.status === "error")
        {
            return user_data;
        }

        const ticket_access = await has_ticket_access(session, ip, ticket_id);

        if (ticket_access.status === "error")
        {
            return ticket_access;
        }

        await con.execute("UPDATE ticket_threads SET state = ? WHERE id = ?", ["Closed", ticket_id]);

        return {status: "success"};
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return {status: "error", error: "Internal server error", error_r: "close_ticket_internal_error"};
    }
}

async function has_ticket_access(session, ip, ticket_id)
{
    try
    {
        const user_data = await user_functions.get_user_data(session, ip);
        if (user_data.status === "error")
        {
            return user_data;
        }

        const is_admin = await user_functions.is_admin(session, ip);
        const is_support = await user_functions.is_support(session, ip);
        const is_staff = (is_admin || is_support);
        
        const [result] = await con.execute("SELECT * FROM ticket_threads WHERE id = ?", [ticket_id]);
        if (result[0])
        {
            if (result[0].owned_by === user_data.data.username || is_staff == true)
            {
                return {status: "success", data: result[0]};
            }
            else
            {
                console.log("admin: " + is_admin + " support: " + is_support + " staff: " + is_staff);
                return {status: "error", error: "You don't have access to this ticket", error_r: "ticket_access_no_access"};
            }
        }
        else
        {
            return {status: "error", error: "Ticket not found", error_r: "ticket_access_not_found"};
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return {status: "error", error: "Internal server error", error_r: "ticket_access_internal_error"};
    }
}

module.exports = 
{
    create_ticket,
    reply_ticket,
    has_ticket_access,
    close_ticket
}