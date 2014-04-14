var	Db = require('mongodb').Db,
	Server = require('mongodb').Server,
	Connection = require('mongodb').Connection,
	options = {};

var env = process.env.NODE_ENV || 'development',
    config = require('./config')[env];

module.exports = new Db(config.db.name, new Server(config.db.host, config.db.port ||
		Connection.DEFAULT_PORT, options), {safe: true});
