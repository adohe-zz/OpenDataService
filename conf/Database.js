var Db = require('mongodb').Db;

Db.STATUS_CODES = {
	100: 'create failed'
};

module.exports = Db;
