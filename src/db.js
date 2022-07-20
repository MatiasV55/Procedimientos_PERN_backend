const { Pool } = require("pg");
const { db } = require("./config");

//ARCHIVO DE CONFIGURACIÓN DE LA BASE DE DATOS

const pool = new Pool({
  user: db.user,
  host: db.host,
  port: db.port,
  database: db.database,
});

module.exports = pool;
