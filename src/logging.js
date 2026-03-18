const fs = require('fs');

const current_log = './logs/runtime.log';
let initialized = false;

const LOGTYPE = {
    INFO: 0,
    WARNING: 1,
    ERROR: 2,
    FATAL: 3,
    MALICIOUS: 4
}

function init()
{
    if (!fs.existsSync('./logs'))
    {
        fs.mkdirSync('./logs');
    }
    if (!fs.existsSync(current_log))
    {
        fs.writeFileSync(current_log, '');
    }
    fs.writeFileSync("./logs/runtime.log", "")
    fs.appendFileSync(current_log, "[START] " + new Date().toLocaleString() + "\n");
    initialized = true;
}

function log(type, message)
{
    if (!initialized)
    {
        init();
    }
    let log_message = '';
    switch (type)
    {
        case LOGTYPE.INFO:
        log_message = '[INFO] ';
        break;
        case LOGTYPE.WARNING:
        log_message = '[WARNING] ';
        break;
        case LOGTYPE.ERROR:
        log_message = '[ERROR] ';
        break;
        case LOGTYPE.FATAL:
        log_message = '[FATAL] ';
        break;
        case LOGTYPE.MALICIOUS:
        log_message = '[MALICIOUS] ';
        break;
        default:
        log_message = '[UNK] ';
        break;
    }
    log_message += message;
    console.log(log_message);
    
    fs.appendFileSync(current_log, log_message + "\n");
}

module.exports = 
{
    LOGTYPE: LOGTYPE,
    log
}
