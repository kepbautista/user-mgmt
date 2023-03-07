const { DATABASE_CONFIG } = require('./config');

const connection = require('serverless-mysql')({
  config: DATABASE_CONFIG
});

module.exports = connection;
