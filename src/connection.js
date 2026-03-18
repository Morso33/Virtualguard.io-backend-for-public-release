"use strict";
var mysql = require('mysql2/promise');
const config = require("../config.json");

let pool;


switch (config.env)
{
  case "dev":
  pool = mysql.createPool({
    host: "REDACTED",
    port : 3306,
    user: "root",
    password: "REDACTED",
    database: "virtualguard",
    waitForConnections: true,
    connectionLimit: 10,
  });
  break;
  case "prod":
  pool = mysql.createPool({
    host: "REDACTED",
    port : 3306,
    user: "worker",
    password: "REDACTED",
    database: "virtualguard",
    waitForConnections: true,
    connectionLimit: 10,
  });
  break;
  default:
  throw new Error("Invalid env: "+config.env);
}

pool.getConnection((err,connection)=> {
  if(err)
  throw err;
  connection.release();
});

module.exports = pool;