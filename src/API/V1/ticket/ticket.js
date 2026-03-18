const express = require('express');
const router = express.Router();
const con = require('../../../connection.js');
const ticket_functions = require('./ticket_functions.js');
const user_functions = require('../user/user_functions.js');
const general_functions = require('../general/general_functions.js');
const logger = require('../../../logging.js');

router.post('/create', async (req, res) => {
    try
    {
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);
        
        const title = req.body.title;
        const content = req.body.content;
        const category = req.body.category;
        
        if (!title || !content || !category)
        {
            return res.json({ status: "error", error: "Missing " + (!title ? "title" : (!content ? "content" : "category")), error_r: "ticket_create_missing_" + (!title ? "title" : (!content ? "content" : "category")) });
        }
        
        const create_ticket_result = await ticket_functions.create_ticket(session, ip, title, content, category);
        if (create_ticket_result.status === "error")
        {
            return res.json(create_ticket_result);
        }
        else
        {
            return res.json({ status: "success", id: create_ticket_result.id });
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.json({ status: "error", error: "Internal server error", error_r: "ticket_create_internal_error" });
    }
});

router.get("/your_tickets", async (req, res) => {
    try
    {
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);
        
        const user_data = await user_functions.get_user_data(session, ip);
        if (user_data.status === "error")
        {
            return res.json(user_data);
        }
        
        const [result] = await con.execute("SELECT * FROM ticket_threads WHERE owned_by = ? ORDER BY id DESC", [user_data.data.username]);
        if (result[0])
        {
            return res.json({ status: "success", data: result });
        }
        else
        {
            return res.json({ status: "success", data: [] });
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.json({ status: "error", error: "Internal server error", error_r: "ticket_your_tickets_internal_error" });
    }
});

router.get ("/view_ticket", async (req, res) => {
    try
    {
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);
        const id = req.query.id;
        
        if (!id)
        {
            return res.json({ status: "error", error: "Missing id", error_r: "ticket_view_ticket_missing_id" });
        }
        
        const user_data = await user_functions.get_user_data(session, ip);
        if (user_data.status === "error")
        {
            return res.json(user_data);
        }

        //Does the user have access to the ticket?
        const ticket_access_status = await ticket_functions.has_ticket_access(session, ip, id);
        if (ticket_access_status.status === "error")
        {
            return res.json(ticket_access_status);
        }
        
        //Select the original ticket
        const [original_ticket] = await con.execute("SELECT * FROM ticket_threads WHERE id = ?", [id]);
        if (!original_ticket[0])
        {
            return res.json({ status: "error", error: "Ticket not found", error_r: "ticket_view_ticket_not_found" });
        }
        //Select all the replies
        const [replies] = await con.execute("SELECT * FROM ticket_replies WHERE reply_to = ?", [id]);

        return res.json({ status: "success", data: { original_ticket: original_ticket[0], replies: replies } });
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.json({ status: "error", error: "Internal server error", error_r: "ticket_view_ticket_internal_error" });
    }
});



router.post("/reply", async (req, res) => {
    try
    {
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);
        
        const id = req.body.id;
        const content = req.body.content;
        
        if (!id || !content)
        {
            return res.json({ status: "error", error: "Missing " + (!id ? "id" : "content"), error_r: "ticket_reply_missing_" + (!id ? "id" : "content") });
        }
        
        const user_data = await user_functions.get_user_data(session, ip);
        if (user_data.status === "error")
        {
            return res.json(user_data);
        }
        
        const reply_status = await ticket_functions.reply_ticket(session, ip, content, id);
        if (reply_status.status === "error")
        {
            return res.json(reply_status);
        }
        else
        {
            return res.json({ status: "success" });
        }
        
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.json({ status: "error", error: "Internal server error", error_r: "ticket_reply_internal_error" });
    }
});

router.post("/close", async (req, res) => {
    try
    {
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);
        
        const id = req.body.id;
        
        if (!id)
        {
            return res.json({ status: "error", error: "Missing id", error_r: "ticket_close_missing_id" });
        }
        
        const close_status = await ticket_functions.close_ticket(session, ip, id);
        if (close_status.status === "error")
        {
            return res.json(close_status);
        }
        else
        {
            return res.json({ status: "success" });
        }
        
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.json({ status: "error", error: "Internal server error", error_r: "ticket_close_internal_error" });
    }
});


module.exports = router;