var	db = require('../config/db'),
	logger = require('../config/log'),
	utils = require('../lib/utils');

var env = process.env.NODE_ENV || 'development',
    config = require('../config/config')[env];

function Entity(entity) {
}

// Export entity
module.exports = Entity;

/**
 * Fetch entity defination from database
 * @param entityName
 * @param callback
 */
Entity.get = function(entityName, callback) {
  // Establish connection to db
	db.open(function(err, db) {
		if(err) {
			return callback(err, null);
		}

    // Authenticate
		db.authenticate(config.db.adminName, config.db.adminPwd, function(err, result) {
			if(result) {
				var query = {};
				if(entityName) {
					query.entity = entityName;
				}

        // Fetch a collection
				var collection = db.collection('entities');
				collection.find(query, {}).toArray(function(err, docs) {
          // Close db connection
          db.close();
					if(err) {
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
			  // Close db connection
			  db.close();
				return callback(utils.error('Auth Error'), null);
			}
		});
	});
}
