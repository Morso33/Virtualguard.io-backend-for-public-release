const con = require('../../../connection.js');
const user_functions = require('../user/user_functions.js');
const fs = require('fs');
const path = require('path');
const logger = require("../../../logging.js");
const {exec, execSync} = require('child_process');
const config = require("../../../../config.json");
const general_functions = require('../general/general_functions.js');

const input_dir = path.join(__dirname, '../../../../filesystem/input/');
const output_dir = path.join(__dirname, '../../../../filesystem/output/');
const config_dir = path.join(__dirname, '../../../../filesystem/config/');
let config_gen_process;
let build_process;

switch (config.env)
{
    case "dev":
    config_gen_process = path.join(__dirname, '../../../../engine/win_x64/config_gen.exe');
    build_process = path.join(__dirname, '../../../../engine/win_x64/build.exe');
    break;
    case "prod":
    config_gen_process = path.join(__dirname, '../../../../engine/linux_x64/config_gen');
    build_process = path.join(__dirname, '../../../../engine/linux_x64/build');
    break;
    default:
    logger.log(logger.LOGTYPE.FATAL, "Failed to determine env in engine_functions.js");
    process.exit(1);
    break;
}


function random_string(length)
{
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var characters_length = characters.length;
    for ( var i = 0; i < length; i++ ) 
    {
        result += characters.charAt(Math.floor(Math.random() * characters_length));
    }
    return result;
}

async function delete_file(session, ip, id)
{
    try
    {
        const get_file_result = await get_file(session, ip, id);
        if (get_file_result.status === "error")
        {
            return get_file_result;
        }
        else
        {
            try
            {
                const file = get_file_result.data;
                const file_path = path.join(input_dir, file.file_location);
                if (fs.existsSync(file_path))
                {
                    fs.unlinkSync(file_path);
                }
            }
            catch (err)
            {
                logger.log(logger.LOGTYPE.ERROR, "delete_file: file deleter error: " + err);
                return {status: "error", error: "Internal server error", error_r: "delete_file_internal_error"};
            }
        }
        try
        {
            if (fs.existsSync(path.join(config_dir, id + ".config")))
            {
                fs.unlinkSync(path.join(config_dir, id + ".config"));
            }
        }
        catch (err)
        {
            logger.log(logger.LOGTYPE.ERROR, "delete_file: config delete error: " + err);
            return {status: "error", error: "Internal server error", error_r: "delete_file_internal_error"};
        }
        //Delete the file from the DB
        try
        {
            const [delete_sql_result] = await con.execute("DELETE FROM file_input WHERE id = ?", [id]);
        }
        catch (err)
        {
            logger.log(logger.LOGTYPE.ERROR, "delete_file: db delete: " + err);
            return {status: "error", error: "Internal server error", error_r: "delete_file_internal_error"};
        }
        //Return success
        await user_functions.edit_files_protected_amount(session, ip, -1);
        return {status: "success"};
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, "delete_file: generic: " + err);
        return {status: "error", error: "Internal server error", error_r: "delete_file_internal_error"};
    }
}

async function upload_file(session, ip, file, project_name, file_type, file_ending, file_size)
{
    try
    {
        const user_data = await user_functions.get_user_data(session, ip);
        if (user_data.status === "error")
        {
            return user_data;
        }
        const file_storage_name = random_string(32) + "." + file_ending;
        
        const [verify_unique_file_storage_name] = await con.execute("SELECT * FROM file_input WHERE file_location = ?", [file_storage_name]);
        if (verify_unique_file_storage_name.length !== 0)
        {
            logger.log(logger.LOGTYPE.WARNING, "upload_file: File storage name already exists: " + file_storage_name);
            return {status: "error", error: "Internal server error. Contact support", error_r: "upload_file_internal_error_file_storage_name_exists"};
        }
        
        const [upload_sql_result] = await con.execute("INSERT INTO file_input (id, project_name, file_type, uploaded_by, uploaded_at, file_location, file_ending, file_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [null, project_name, file_type, user_data.data.username, Math.floor(Date.now() / 1000), file_storage_name, file_ending, file_size]);
        if (upload_sql_result.affectedRows === 1)
        {
            fs.writeFileSync(path.join(input_dir, file_storage_name), file.data, (err) => {
                if (err) throw err;
            });
            //Generate config
            const generate_config_result = await generate_config(session, ip, file, file_storage_name);
            if (generate_config_result.status === "error")
            {
                await delete_file(session, ip, upload_sql_result.insertId);
                return generate_config_result;
            }
            else
            {
                //Write to DB
                const [config_sql_result] = await con.execute("UPDATE file_input SET config = ? WHERE id = ?", [generate_config_result.data, upload_sql_result.insertId]);
                
                if (config_sql_result.affectedRows === 1)
                {
                    await user_functions.edit_files_protected_amount(session, ip, 1);
                    return {status: "success", id: upload_sql_result.insertId};
                }
                else
                {
                    logger.log(logger.LOGTYPE.ERROR, "upload_file: Database write failed: " + config_sql_result);
                    return {status: "error", error: "Internal server error", error_r: "upload_file_internal_error_database_write"};
                }
            }
        }
        else
        {
            logger.log(logger.LOGTYPE.ERROR, "upload_file: Database write failed");
            return {status: "error", error: "Internal server error", error_r: "upload_file_internal_error_database_write"};
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, "upload_file: " + err.stack);
        return {status: "error", error: "Internal server error", error_r: "upload_file_internal_error"};
    }
}


async function build(session,ip,file_id)
{
    try
    {
        const function_start_time = Date.now();
        const user_data = await user_functions.get_user_data(session, ip);
        if (user_data.status === "error")
        {
            return user_data;
        }
        const [result] = await con.execute("SELECT * FROM file_input WHERE id = ? AND uploaded_by = ?", [file_id, user_data.data.username]);
        if (result.length === 0)
        {
            return {status: "error", error: "You do not have permission to build this file", error_r: "build_permission_denied"};
        }
        const file = result[0];
        if (file.config === null)
        {
            return {status: "error", error: "You must generate a config before building", error_r: "build_no_config"};
        }

        
        //Write the config to a file
        const write_config_result = await write_config_to_file(file.config, file.id);
        if (write_config_result !== true)
        {
            logger.log(logger.LOGTYPE.ERROR, "build: Unable to write config to file");
            return {status: "error", error: "Unable to write config to file", error_r: "build_config_write_error"};
        }
        //The config is now written to a file, continue with the build process
        try
        {
            //Validate file.id is a number
            if (isNaN(file.id))
            {
                logger.log(logger.LOGTYPE.MALICIOUS, "build: file.id is not a number");
                general_functions.set_site_maintenance("Malicious activity error: 1");
                return {status: "error", error: "Internal server error", error_r: "security_error_1"};
            }
            //Validate no path traversal on file.file_location
            if (file.file_location.includes("..") || file.file_location.includes("/") || file.file_location.includes("\\"))
            {
                logger.log(logger.LOGTYPE.MALICIOUS, "build: file.file_location contains path traversal");
                general_functions.set_site_maintenance("Malicious activity error: 2");
                return {status: "error", error: "Internal server error", error_r: "security_error_2"};
            }
            //Does file.file_location exist?
            if (!fs.existsSync(path.join(input_dir, file.file_location)))
            {
                logger.log(logger.LOGTYPE.WARNING, "build: file.file_location does not exist");
                return {status: "error", error: "Internal server error", error_r: "file_access_error"};
            }
            
            //-production <config_location> <input_dir> <output_dir>
            const command = `${build_process} -production ${path.join(config_dir, file.id + ".config")} ${path.join(input_dir, file.file_location)} ${path.join(output_dir, file.file_location)}`;
            const stdout = execSync(command);
            
            //Success, log and return
            log_build_event(file.id, "success", stdout.toString());
            return {status: "success", process_output: stdout.toString(), time_taken: Date.now() - function_start_time};
        }
        catch (error) {
            const stderr = error.stderr.toString();
            //Log the error and return
            log_build_event(file.id, "error", stderr ? stderr : error.toString());
            return { status: "error", error: "There was an error protecting the file.\nFile ID: " + file.id, error_r: "build_error" };
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, "build :" + err.stack);
        log_build_event(file.id, "command_error", err.stack);
        return {status: "error", error: "Internal server error", error_r: "build_internal_error"};
    }
}

async function write_config_to_file(config, file_id)
{
    fs.writeFileSync(path.join(config_dir, file_id + ".config"), config, (err) => {
        if (err)
        {
            logger.log(logger.LOGTYPE.ERROR, "write_config_to_file: " + err);
            return false;
        }
    }
    );
    return true;
}


async function get_file(session, ip, id)
{
    try
    {
        const user_data = await user_functions.get_user_data(session, ip);
        if (user_data.status === "error")
        {
            return user_data;
        }
        const [result] = await con.execute("SELECT * FROM file_input WHERE id = ? AND uploaded_by = ?", [id, user_data.data.username]);
        if (result.length === 0)
        {
            return {status: "error", error: "File not found", error_r: "get_file_file_not_found"};
        }
        else
        {
            return {status: "success", data: result[0]};
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, "get_file: " + err);
        return {status: "error", error: "Internal server error", error_r: "get_file_internal_error"};
    }
}

function engine_log_to_ascii(input) {
    try
    {
        
        const cleanString = input.replace(/\x1B\[.*?m/g, '');
        return cleanString;
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, "engine_log_to_ascii: " + err);
        return input;
    }
}

async function log_build_event(file_id, build_status, build_data)
{
    try
    {
        build_data = await engine_log_to_ascii(build_data);
        
        const [result] = await con.execute("INSERT INTO builds_log (file_id, build_status, build_data, build_time) VALUES (?, ?, ?, ?)", [file_id, build_status, build_data, Math.floor(Date.now() / 1000)]);
        if (result.affectedRows === 1)
        {
            return {status: "success"};
        }
        else
        {
            logger.log(logger.LOGTYPE.ERROR, "log_build_event: Database write failed");
            return {status: "error", error: "Internal server error", error_r: "log_build_event_internal_error_database_write"};
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, "log_build_event: " + err);
        return {status: "error", error: "Internal server error", error_r: "log_build_event_internal_error"};
    }
} 

async function serve_file(session, ip, id)
{
    try
    {
        const get_file_result = await get_file(session, ip, id);
        if (get_file_result.status === "error")
        {
            return get_file_result;
        }
        else
        {
            const file = get_file_result.data;
            const file_path = path.join(output_dir, file.file_location);
            if (!fs.existsSync(file_path))
            {
                logger.log(logger.LOGTYPE.ERROR, "serve_file: File not found: " + file_path);
                return {status: "error", error: "File not found", error_r: "serve_file_file_not_found"};
            }
            else
            {
                return {status: "success", file_location: file_path};
            }
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, "serve_file: " + err);
        return {status: "error", error: "Internal server error", error_r: "serve_file_internal_error"};
    }
}

async function generate_config(session, ip, file, file_storage_name)
{
    try
    {
        const user_data = await user_functions.get_user_data(session, ip);
        if (user_data.status === "error")
        {
            logger.log(logger.LOGTYPE.WARNING, "generate_config: user auth fail: " + user_data.error);
            return user_data;
        }
        
        try {
            //Security checks
            //Validate the file exists
            if (!fs.existsSync(path.join(input_dir, file_storage_name)))
            {
                logger.log(logger.LOGTYPE.ERROR, "generate_config: File not found: " + file_storage_name);
                return {status: "error", error: "Internal server error", error_r: "generate_config_file_not_found"};
            }
            const command = `${config_gen_process} ${path.join(input_dir, file_storage_name)}`;
            const stdout = execSync(command);
            
            const generatedConfig = stdout.toString();
            return { status: "success", data: generatedConfig };
        } catch (error) {
            const stderr = error.stderr.toString()
            logger.log(logger.LOGTYPE.WARNING, `config_gen error: ${stderr ? stderr : error.toString()}`);
            return { status: "error", error: "We were unable to parse the uploaded file. Please verify the file is .NET", error_r: "generate_config_error" };
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, "generate_config:" + err.stack);
        return {status: "error", error: "Internal server error", error_r: "generate_config_internal_error"};
    }
}


async function update_config(session, ip, id, config)
{
    try
    {
        const user_data = await user_functions.get_user_data(session, ip);
        
        if (user_data.status === "error")
        {
            logger.log(logger.LOGTYPE.WARNING, "update_config: user auth fail: " + user_data.error);
            return user_data;
        }
        
        const [result] = await con.execute("UPDATE file_input SET config = ? WHERE id = ? AND uploaded_by = ?", [config, id, user_data.data.username]);
        if (result.affectedRows === 1)
        {
            return {status: "success"};
        }
        else
        {
            return {status: "error", error: "You do not have permission to update this config", error_r: "update_config_permission_denied"};
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, "update_config: " + err);
        return {status: "error", error: "Internal server error", error_r: "update_config_internal_error"};
    }
}

async function update_last_build_time(session, ip, id, time)
{
    try
    {
        const user_data = await user_functions.get_user_data(session, ip);
        
        if (user_data.status === "error")
        {
            logger.log(logger.LOGTYPE.WARNING, "update_last_build_time: user auth fail: " + user_data.error);
            return user_data;
        }
        
        const [result] = await con.execute("UPDATE file_input SET last_build_time = ? WHERE id = ? AND uploaded_by = ?", [time, id, user_data.data.username]);
        if (result.affectedRows === 1)
        {
            return {status: "success"};
        }
        else
        {
            return {status: "error", error: "You do not have permission to update this config", error_r: "update_last_build_time_permission_denied"};
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, "update_last_build_time: " + err);
        return {status: "error", error: "Internal server error", error_r: "update_last_build_time_internal_error"};
    }
}

module.exports = 
{
    upload_file, 
    build,
    get_file,
    generate_config,
    update_config,
    serve_file,
    update_last_build_time,
    delete_file
};