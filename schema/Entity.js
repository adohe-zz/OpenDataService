var setting = require('../config/setting'),
	db = require('../config/db'),
	logger = require('../config/log'),
	utils = require('../utils/utils');

function Entity(entity) {
}

module.exports = Entity;

/**
 * Fetch entity defination from database
 * @param entityName
 * @param callback
 */
Entity.get = function(entityName, callback) {
	db.open(function(err, db) {
		if(err) {
			return callback(err, null);
		}

		db.authenticate(setting.dbAdminName, setting.dbAdminPwd, function(err, result) {
			if(result) {
				var query = {};
				if(entityName) {
					query.entity = entityName;
				}
				var collection = ;
			} else {
				return callback(utils.error('authenticate failed'), null);
			}
		});
	});
}
