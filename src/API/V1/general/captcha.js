const config = require('../../../../config.json');
const logger = require('../../../logging.js');
const axios = require('axios');
const fs = require('fs');


async function validate_recaptcha_v2(api_response)
{
    try
    {
        const response = await axios.post("https://www.google.com/recaptcha/api/siteverify", null, 
        {
            params: {
                secret: config.google_captcha_secret_key,
                response: api_response,
            }
        });
        if (response.data.success)
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

module.exports = {
    validate_recaptcha_v2
};