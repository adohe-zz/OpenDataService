var	db = require('../config/db'),
	logger = require('../config/log'),
	utils = require('../lib/utils'),
	mongodb = require('mongodb');

var env = process.env.NODE_ENV || 'development',
    config = require('../config/config')[env];

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

		db.authenticate(config.db.adminName, config.db.adminPwd, function(err, result) {
			if(result) {
				var query = {};
				if(entityName) {
					query.entity = entityName;
				}
				var collection = new mongodb.Collection(db, 'entities');
				collection.find(query, {}).toArray(function(err, docs) {
					if(err) {
						mongodb.close();
						logger.error('There is a error when fetch data from entities...');
						callback(err, null);
					}

					var entities = [];
					docs.forEach(function(doc) {
						var entity = new Entity(doc);
						entities.push(entity);
					});
					callback(null, entities);
				});
			} else {
				return callback(utils.error('authenticate failed'), null);
			}
		});
	});
}
