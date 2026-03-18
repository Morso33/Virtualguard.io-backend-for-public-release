const con = require('../../../connection.js');
const bcrypt = require("bcryptjs")
const crypto = require('crypto');
const logger = require('../../../logging.js');
const email_functions = require('../email/email_functions.js');

async function username_exists(username) {
    try
    {
        const [result] = await con.execute("SELECT * FROM users WHERE username = ?", [username]);
        if (result[0])
        {
            return true;
        }
        else
        {
            return false;
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return false;
    }
}

async function verify_credentials(username, password) {
    try
    {
        const [result] = await con.execute("SELECT * FROM users WHERE username = ?", [username]);
        if (result[0])
        {
            if (bcrypt.compareSync(password, result[0].password_bcrypt))
            {
                return {status: "success"};
            }
            else
            {
                return {status: "error", error: "Incorrect password", error_r: "login_incorrect_password"};
            }
        }
        else
        {
            return {status: "error", error: "Username does not exist", error_r: "login_username_not_found"};
        }
    }
    catch (err) 
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return {status: "error", error: "Internal server error", error_r: "login_internal_error"};
    }
}

async function initalize_session(username, password, ip)
{
    try {
        //Verify user credentials
        const verify_credentials_result = await verify_credentials(username, password);
        if (verify_credentials_result.status === "error")
        {
            return {status: "error", error: "Username or password incorrect", error_r: "initalize_session_incorrect_credentials"};
        }
        //Login OK, create session
        const session_token = await create_session_token("session");
        
        const [result] = await con.execute("UPDATE users SET session_token = ?, session_ip = ?, session_token_expiry = ? WHERE username = ?", [session_token, ip, Math.floor(Date.now() / 1000) + 60 * 60 * 6, username]); //Expire in 6 hours
        if (result.affectedRows === 1) {
            //check is admin
            const is_admin_result = await is_admin(session_token, ip);
            const is_support_result = await is_support(session_token, ip);
            const is_staff = (is_admin_result || is_support_result);

            return {status: "success", session_token: session_token, is_staff: is_staff};
        }
    }
    catch (err) {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return {status: "error", error: "Internal server error", error_r: "initalize_session_internal_error"};
    }
}

async function authorize(session, ip)
{
    try
    {
        if (!session || !ip)
        {
            return {status: "error", error: "Missing " + (!session ? "session" : "ip"), error_r: "authorize_missing_" + (!session ? "session" : "ip"), request_reauth: true};
        }
        const [result_session_verify] = await con.execute("SELECT * FROM users WHERE session_token = ?", [session]);
        if (!result_session_verify[0])
        {
            return {status: "error", error: "Your session has expired. Please log in again", error_r: "user_authorize_session_invalid", request_reauth: true};
        }
        if (result_session_verify[0].session_ip !== ip)
        {
            return {status: "error", error: "Please log in again", error_r: "user_authorize_ip_invalid", request_reauth: true};
        }
        if (result_session_verify[0].session_token_expiry < Math.floor(Date.now() / 1000))
        {
            return {status: "error", error: "Your session has expired. Please log in again", error_r: "user_authorize_session_expired", request_reauth: true};
        }
        return {status: "success", username: result_session_verify[0].username};
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return {status: "error", error: "Internal server error", error_r: "user_authorize_internal_error", request_reauth: true};
    }
}

//This returns all user data, DO NOT SEND THIS TO THE CLIENT!
async function get_user_data(session, ip)
{
    try
    {
        const user_auth = await authorize(session, ip);
        if (user_auth.status === "error")
        {
            return user_auth;
        }
        const [result] = await con.execute("SELECT * FROM users WHERE session_token = ?", [session]);
        return {status: "success", data: result[0]};
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return {status: "error", error: "Internal server error", error_r: "user_get_user_data_internal_error"};
    }
}

async function destroy_session(session)
{
    try
    {
        if (!session)
        {
            return {status: "error", error: "Missing session for action: destroy_session", error_r: "user_logout_missing_session"};
        }
        
        const [result] = await con.execute("UPDATE users SET session_token = NULL, session_ip = NULL WHERE session_token = ?", [session]);
        if (result.affectedRows === 1)
        {
            return {status: "success"};
        }
        else
        {
            return {status: "error", error: "Unable to destroy session", error_r: "user_logout_unable_to_destroy_session"};
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return {status: "error", error: "Internal server error", error_r: "user_logout_internal_error"};
    }
}

async function create_session_token(type)
{
    const buffer = crypto.randomBytes(32);
    const token = buffer.toString('hex');
    return type + "-" + token;
}

async function is_admin(session, ip)
{
    try
    {
        const user_data = await get_user_data(session, ip);
        if (user_data.status === "error")
        {
            return false;
        }
        if (user_data.data.is_admin === 1)
        {
            return true;
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return false;
    }
}

async function is_support(session, ip)
{
    try
    {
        const user_data = await get_user_data(session, ip);
        if (user_data.status === "error")
        {
            return false;
        }
        if (user_data.data.is_support === 1)
        {
            return true;
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return false;
    }
}

//This returns all projects by the user, it is safe to send this to the client
async function get_projects_by_user(session, ip)
{
    try
    {
        const user_auth = await authorize(session, ip);
        if (user_auth.status === "error")
        {
            return user_auth;
        }
        const [result] = await con.execute("SELECT * FROM file_input WHERE uploaded_by = ? ORDER BY uploaded_at DESC", [user_auth.username]);
        return {status: "success", data: result};
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return {status: "error", error: "Internal server error", error_r: "user_get_projects_by_user_internal_error"};
    }
}

async function edit_files_protected_amount(session, ip, delta)
{
    try
    {
        const user_auth = await authorize(session, ip);
        if (user_auth.status === "error")
        {
            return user_auth;
        }
        const [result] = await con.execute("UPDATE users SET total_files_protected = total_files_protected + ? WHERE session_token = ?", [delta, session]);
        if (result.affectedRows === 1)
        {
            return {status: "success"};
        }
        else
        {
            return {status: "error", error: "Unable to edit files protected amount", error_r: "user_edit_files_protected_unable_to_edit"};
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return {status: "error", error: "Internal server error", error_r: "user_edit_files_protected_internal_error"};
    }
}

async function client_request_password_reset(username)
{
    try
    {
        //Check if username exists
        const username_exists_result = await username_exists(username);
        if (!username_exists_result)
        {
            return {status: "error", error: "That username does not exist", error_r: "client_request_password_reset_username_not_found"};
        }
        //Generate reset token
        const reset_token = await create_session_token("reset")
        //Insert reset token into database
        const [result] = await con.execute("UPDATE users SET password_reset_token = ?, password_reset_token_expiry = ? WHERE username = ?", [reset_token, Math.floor(Date.now() / 1000) + 60 * 15, username]); //Expire in 15 minutes
        if (result.affectedRows === 1)
        {
            //Send email
            const send_password_reset_email_result = await email_functions.send_password_reset_email(username, reset_token);
            if (send_password_reset_email_result.status === "success")
            {
                return {status: "success"};
            }
            else
            {
                return {status: "error", error: "Unable to send password reset email", error_r: "client_request_password_reset_unable_to_send_email"};
            }
        }
        else
        {
            logger.log(logger.LOGTYPE.ERROR, "Unable to insert reset token into database");
            return {status: "error", error: "Unable to insert reset token into database", error_r: "client_request_password_reset_unable_to_insert_reset_token"};
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return {status: "error", error: "Internal server error", error_r: "client_request_password_reset_internal_error"};
    }
}

async function reset_client_password(reset_token, new_password)
{
    try
    {
        //Check if reset token exists
        const [result] = await con.execute("SELECT * FROM users WHERE password_reset_token = ?", [reset_token]);
        if (!result[0])
        {
            return {status: "error", error: "Invalid reset token", error_r: "reset_client_password_invalid_reset_token"};
        }
        //Check if reset token is expired
        if (result[0].password_reset_token_expiry < Math.floor(Date.now() / 1000))
        {
            return {status: "error", error: "Reset token expired", error_r: "reset_client_password_reset_token_expired"};
        }
        //Update password
        const new_password_bcrypt = bcrypt.hashSync(new_password, 8);
        const [result_update] = await con.execute("UPDATE users SET password_bcrypt = ?, password_reset_token = NULL, password_reset_token_expiry = NULL WHERE password_reset_token = ?", [new_password_bcrypt, reset_token]);
        if (result_update.affectedRows === 1)
        {
            return {status: "success"};
        }
        else
        {
            logger.log(logger.LOGTYPE.ERROR, "Unable to update password: " + reset_token);
            return {status: "error", error: "Unable to update password", error_r: "reset_client_password_unable_to_update_password"};
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return {status: "error", error: "Internal server error", error_r: "reset_client_password_internal_error"};
    }
}

module.exports = 
{
    username_exists,
    verify_credentials,
    initalize_session,
    authorize,
    get_user_data,
    is_admin,
    destroy_session,
    get_projects_by_user,
    is_support,
    edit_files_protected_amount,
    client_request_password_reset,
    reset_client_password
}