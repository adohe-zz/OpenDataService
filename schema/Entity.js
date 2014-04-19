var	db = require('../config/db'),
	logger = require('../config/log'),
	utils = require('../lib/utils');

var env = process.env.NODE_ENV || 'development',
    config = require('../config/config')[env];

function Entity(entityName, projectName, source, table, cache,
    env, properties, stat, rowCount, lastUpdate) {
      console.log('here');
      this.EntityName = entityName;
      this.ProjectName = projectName;
      this.Source = source;
      this.Table = table;
      this.Cache = cache;
      this.Env = env || 'prod';
      this.Properties = properties || {};
      this.Status = stat || 'pending';
      this.RowCount = rowCount || 0;
      this.LastUpdate = lastUpdate || new Date();
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
					query.EntityName = entityName;
				}

        // Fetch a collection
				var collection = db.collection('entities');
				collection.findOne(query, function(err, doc) {
				  // Close db connection
				  db.close();
          callback(err, doc);
        });
			} else {
			  // Close db connection
			  db.close();
				return callback(utils.error('Auth Error'), null);
			}
		});
	});
}

/**
 * Fetch all entities
 * @param callback function
 *
 */
Entity.getEntities = function(callback) {
  // Establish connection to db
  db.open(function(err, db) {
    if(err) {
      return callback(err, null);
    }

    // Authenticate
    db.authenticate(config.db.adminName, config.db.adminPwd, function(err, result) {
      if(result) {
        // Fetch a collection
        db.collection('entities', function(err, collection) {
          if(err) {
            // Close db connection
            db.close();
            return callback(err, null);
          }

          collection.find({}).toArray(function(err, docs) {
            // Close db connection
            db.close();
            if(err) {
              callback(err, null);
            }

            var entities = [];
            docs.forEach(function(doc, index) {
              var entity = new Entity(doc.EntityName, doc.ProjectName, doc.Source,
                doc.Table, doc.Cache, doc.Env, doc.Properties, doc.Status, doc.RowCount, doc.LastUpdate);
              entities.push(entity);
            });
            callback(err, entities);
          });
        });
      } else {
      }
    });
  });
}

/**
 * Create a new entity
 * @param callback function
 *
 */
Entity.prototype.save = function(callback) {
  // The new created entity model
  var entity = {
    EntityName: this.EntityName,
    ProjectName: this.ProjectName,
    Source: this.Source,
    Table: this.Table,
    Cache: this.Cache,
    Env: this.Env,
    Properties: this.Properties,
    Status: this.Status,
    RowCount: this.RowCount,
    LastUpdate: this.LastUpdate
  };

  // Establish connection to db
  db.open(function(err, db) {
    if(err) {
      return callback(err);
    }

    // Authenticate
    db.authenticate(config.db.adminName, config.db.adminPwd, function(err, result) {
      if(result) {
        // Fetch a collection
        db.collection('entities', function(err, collection) {
          if(err) {
            // Close db connection
            db.close();
            return callback(err);
          }

          collection.insert(entity, {safe: true}, function(err, result) {
            // Close db connection
            db.close();
            callback(err, result);
          });
        });
      } else {
        // Close db connection
        db.close();
        callback(utils.error('Auth Error'));
      }
    });
  });
}
