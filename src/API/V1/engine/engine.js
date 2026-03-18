const express = require('express');
const router = express.Router();
const engine_functions = require('./engine_functions.js');
const general_functions = require('../general/general_functions.js');
const fs = require('fs');
const path = require('path');
const logger = require('../../../logging.js');


router.post('/upload', async (req, res) => {
    try
    {
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);
        
        const file = req.files.file;
        const project_name = req.body.filename;
        const file_type = req.body.filetype;
        const start_time = Math.floor(Date.now());
        const file_ending = file.name.split('.').pop();
        const file_size = file.size;
        
        //File validation
        if (!project_name || !file_type || !file)
        {
            return res.json({ status: "error", error: "Missing " + (!project_name ? "project_name" : (!file_type ? "file_type" : "file")) + ". The file may be corrupted.", error_r: "engine_upload_missing_" + (!project_name ? "project_name" : (!file_type ? "file_type" : "file")) });
        }
        if (!file)
        {
            return res.json({ status: "error", error: "Missing file", error_r: "engine_upload_missing_file" });
        }
        if (file_ending.toLowerCase() !== "exe" && file_ending.toLowerCase() !== "dll")
        {
            return res.json({ status: "error", error: "User declared invalid file type", error_r: "engine_upload_user_declared_invalid_file_type" });
        }
        if (file_type !== "application/x-msdownload")
        {
            return res.json({ status: "error", error: "File type reported as non-executable", error_r: "engine_upload_file_type_reported_as_non_executable" });
        }
        if (project_name.length > 100)
        {
            return res.json({ status: "error", error: "File name too long", error_r: "engine_upload_project_name_too_long" });
        }
        
        const upload_result = await engine_functions.upload_file(session, ip, file, project_name, file_type, file_ending, file_size);
        
        if (upload_result.status === "error")
        {
            return res.json(upload_result);
        }
        else
        {
            const end_time = Math.floor(Date.now());
            return res.json({ status: "success", id: upload_result.id, elapsed: end_time - start_time });
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.json({ status: "error", error: "Internal server error", error_r: "engine_upload_internal_error" });
    }
});

router.get('/get_file', async (req, res) => {
    try
    {
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);
        const id = req.query.id;
        
        if (!id)
        {
            return res.json({ status: "error", error: "Missing id", error_r: "engine_get_file_missing_id" });
        }
        
        const get_file_result = await engine_functions.get_file(session, ip, id);
        if (get_file_result.status === "error")
        {
            return res.json(get_file_result);
        }
        else
        {
            return res.json(get_file_result);
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.json({ status: "error", error: "Internal server error", error_r: "engine_get_file_internal_error" });
    }
});

router.get('/serve_file', async (req, res) => {
    try
    {
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);
        const id = req.query.id;
        
        if (!id)
        {
            return res.json({ status: "error", error: "Missing id", error_r: "engine_serve_file_missing_id" });
        }
        const serve_file_result = await engine_functions.serve_file(session, ip, id);
        if (serve_file_result.status === "error")
        {
            return res.json(serve_file_result);
        }
        else
        {
            //Get file details
            const get_file_result = await engine_functions.get_file(session, ip, id);
            if (get_file_result.status === "error")
            {
                return res.json(get_file_result);
            }
            else
            {
                //Success, serve.
                const file_config = JSON.parse(get_file_result.data.config);
                return res.download(serve_file_result.file_location,file_config.OutputFileName);
            }
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.json({ status: "error", error: "Internal server error", error_r: "engine_serve_file_internal_error" });
    }
});


router.post('/update_config', async (req, res) => {
    try
    {
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);
        const id = req.body.id;
        const config = req.body.config;
        
        if (!id || !config)
        {
            return res.json({ status: "error", error: "Missing " + (!id ? "id" : "config") + ". The file may be corrupted.", error_r: "engine_update_config_missing_" + (!id ? "id" : "config") });
        }
        
        const update_config_result = await engine_functions.update_config(session, ip, id, config);
        if (update_config_result.status === "error")
        {
            return res.json({ status: "error", error: "Failed to update config: " + update_config_result.error, error_r: update_config_result.error_r });
        }
        else
        {
            const update_last_build_time_result = await engine_functions.update_last_build_time(session, ip, id, 0);
            if (update_last_build_time_result.status === "error")
            {
                return res.json({ status: "error", error: "Failed to update last build time: " + update_last_build_time_result.error, error_r: update_last_build_time_result.error_r });
            }
            else
            {
                return res.json(update_config_result);
            }
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.json({ status: "error", error: "Internal server error", error_r: "engine_update_config_internal_error" });
    }
});

router.post('/build', async (req, res) => {
    try
    {
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);
        const file_id = req.body.id;
        
        const build_result = await engine_functions.build(session, ip, file_id);
        
        if (build_result.status === "error")
        {
            return res.json(build_result);
        }
        else
        {
            const update_last_build_time_result = await engine_functions.update_last_build_time(session, ip, file_id, Math.floor(Date.now() / 1000));
            if (update_last_build_time_result.status === "error")
            {
                return res.json({ status: "error", error: "Failed to update last build time: " + update_last_build_time_result.error, error_r: update_last_build_time_result.error_r });
            }
            else
            {
                return res.json(build_result);
            }
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.json({ status: "error", error: "Internal server error", error_r: "engine_build_internal_error" });
    }
});

router.get('/delete', async (req, res) => {
    try
    {
        const session = req.cookies._vg_session;
        const ip = general_functions.get_ip(req);
        const file_id = req.query.id;
        
        const delete_result = await engine_functions.delete_file(session, ip, file_id);

        console.log(delete_result);
        
        if (delete_result.status === "error")
        {
            return res.json(delete_result);
        }
        else
        {
            return res.json(delete_result);
        }
    }
    catch (err)
    {
        logger.log(logger.LOGTYPE.ERROR, err.stack);
        return res.json({ status: "error", error: "Internal server error", error_r: "engine_delete_internal_error" });
    }
});


module.exports = router;