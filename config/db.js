var setting = require('./setting'),
	Db = require('mongodb').Db,
	Server = require('mongodb').Server,
	Connection = require('mongodb').Connection,
	options = {};

module.exports = new Db(setting.db, new Server(setting.dbHost, setting.dbPort ||
		Connection.DEFAULT_PORT, options), {safe: true});
