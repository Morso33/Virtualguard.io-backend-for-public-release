const config = require('../../../../config.json');
const logger = require('../../../logging.js');
const fs = require('fs');

function get_ip(req)
{
  return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
}

function random_string(length)
{
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for(var i=0;i<length;i++)
  {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function determine_request_trust(req) {
  let score = 100;
  let detections = [];

  const isDirectAccess = req.headers['x-forwarded-for'] === undefined;
  if (isDirectAccess) {
    detections.push('direct access');
    score -= 100;
  }
  
  // Check for common bot-like user agents
  const botUserAgents = ['bot', 'crawler', 'spider'];
  const userAgent = req.get('User-Agent');
  if (userAgent && botUserAgents.some(keyword => userAgent.toLowerCase().includes(keyword))) {
    detections.push('bot user agent');
    score -= 80;
  }
  
  // Check for suspicious headers often used by bots
  if (req.headers['accept-language'] === undefined || req.headers['accept-encoding'] === undefined) {
    detections.push('ACP headers');
    score -= 70;
  }
  
  // Check for suspicious request headers
  const suspiciousHeaders = ['Referer', 'Origin', 'Host'];
  if (suspiciousHeaders.some(header => req.headers[header] === undefined)) {
    //Only flag if one or less of the headers are present
    if (suspiciousHeaders.filter(header => req.headers[header] === undefined).length <= 1) {
      detections.push('RefOrgHos headers');
      score -= 25;
    }
  }
  
  // Check for mismatch between user agent and IP
  const forwardedFor = req.headers['x-forwarded-for'];
  const clientIp = forwardedFor ? forwardedFor.split(',')[0] : req.connection.remoteAddress;
  if (userAgent && clientIp && userAgent.includes(clientIp)) {
    detections.push('UA and IP mismatch');
    score -= 25;
  }
  
  // Check for automated behavior in form submissions
  const contentType = req.get('Content-Type');
  if (contentType === 'application/x-www-form-urlencoded' && req.body && Object.keys(req.body).length > 0) {
    detections.push('form automation');
    score -= 60;
  }
  
  // Check for headless browser-like behavior
  const isHeadlessBehavior = req.headers['accept'] === 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' &&
  req.headers['accept-language'] === 'en-US,en;q=0.5' &&
  req.headers['accept-encoding'] === 'gzip, deflate, br' &&
  req.headers['upgrade-insecure-requests'] === '1' &&
  req.headers['te'] === 'trailers';
  if (isHeadlessBehavior) {
    detections.push('headless browser');
    score -= 60;
  }
  
  
  const suspiciousPatterns = [
    /\.php$/,         // Common in bot URLs
    /\.asp$/,         // Common in bot URLs
    /\.aspx$/,        // Common in bot URLs
    /\/wp-admin/,     // WordPress admin path
    /\/wp-content/,     // WordPress content path
    /\/wp-includes/,     // WordPress includes path
    /\/phpmyadmin/,  // phpmyadmin, we don't use it, so just flag it
    /\/laravel/,  // laravel admin panel
  ];
  if (suspiciousPatterns.some(pattern => pattern.test(req.url))) {
    detections.push('PenTest');
    score -= 100;
  }
  
  // Check for excessive request parameters
  const maxParameterCount = 10;
  if (req.query && Object.keys(req.query).length > maxParameterCount) {
    detections.push('excessive query parameters');
    score -= 25;
  }
  
  // Check for inconsistent behavior in headers
  if (req.headers['accept-language'] && !req.headers['accept-language'].includes(',')) {
    detections.push('inconsistent headers');
    score -= 60;
  }
  
  //force score 0-100
  score = Math.max(score, 0);
  score = Math.min(score, 100);
  return {score, detections, isDirectAccess};
}

function set_site_maintenance(reason)
{
  //Edit config.json
  config.maintenance = true;
  logger.log(logger.LOGTYPE.MALICIOUS, "Site has been set to maintenance automatically. Reason: " + reason);
  fs.writeFileSync('../config.json', JSON.stringify(config));
}
function unset_site_maintenance()
{
  //Edit config.json
  config.maintenance = false;
  logger.log(logger.LOGTYPE.INFO, "Site has been unset from maintenance automatically.");
  fs.writeFileSync('../config.json', JSON.stringify(config));
}

module.exports = {
  get_ip,
  random_string,
  determine_request_trust,
  set_site_maintenance,
  unset_site_maintenance
};