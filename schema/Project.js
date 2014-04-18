var db = require('../config/db'),
    logger = require('../config/log'),
    utils = require('../lib/utils'),
    env = process.env.NODE_ENV || 'development',
    config = require('../config/config')[env];

function Project(project) {
  this.name = project.name;
  this.prefix = project.prefix;
  this.env = project.env;
  this.owner = project.owner;
}

// Export project
module.exports = Project;

/**
 * Fetch all the projects
 * @param callback function
 */
Project.getProjects = function(callback) {
  // Establish connection to db
  db.open(function(err, db) {
    if(err) {
      return callback(err);
    }

    // Authenticate
    db.authenticate(config.db.adminName, config.db.adminPwd, function(err, result) {
      if(result) {
        // Fetch a collection
        db.collection('projects', function(err, collection) {
          if(err) {
            // Close the db connection
            db.close();
            return callback(err);
          }

          var query = {};
          collection.find(query).toArray(function(err, docs) {
            // Close the db connection once we get all the docs
            db.close();
            if(err) {
              callback(err, null);
            } else {
              var projects = [];
              docs.forEach(function(doc, index) {
                projects.push(new Project(doc));
              });

              callback(null, projects);
            }
          });
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
 * Create a new project
 * @param callback function
 */
Project.prototype.save = function(callback) {
  // Construct a new project
  var project = {
    name: this.name,
    prefix: this.prefix,
    env: this.env,
    owner: this.owner
  };

  // Establish connection to db
  db.open(function(err, db) {
    if(err) {
      return callback(err, null);
    }

    // Authenticate
    db.authenticate(config.db.adminName, config.db.adminPwd, function(err, result) {
      if(result) {
        // Fetch a collection
        db.collection('projects', function(err, collection) {
          if(err) {
            // Close db connection
            db.close();
            return callback(err, null);
          }

          collection.insert(project, {safe: true}, function(err, result) {
            // Close db connection
            db.close();
            callback(err, result);
          });
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
 * Get the project by name
 * @param projectname
 * @param callback function
 *
 */
Project.get = function(name, callback) {
  // Establish connection to db
  db.open(function(err, db) {
    if(err) {
      return callback(err, null);
    }

    // Authenticate
    db.authenticate(config.db.adminName, config.db.adminPwd, function(err, result) {
      if(result) {
        // Fetch a collection
        db.collection('projects', function(err, collection) {
          if(err) {
            // Close db connection
            db.close();
            return callback(err, null);
          }

          var query = {name: name};
          collection.findOne(query, function(err, doc) {
            // Close db connection
            db.close();
            callback(err, doc);
          });
        });
      } else {
        // Close db connection
        db.close();
        return callback(utils.error('Auth Error'), null);
      }
    });
  });
}
