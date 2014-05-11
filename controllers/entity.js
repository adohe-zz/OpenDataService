var Entity = require('../schema/Entity'),
    Project = require('../schema/Project'),
    http = require('http');

/**
 * New entity page
 *
 */
exports.index = function(req, res) {
  Project.getProjects(function(err, projects) {
    if(err) {
    } else {
      res.render('newentity', {
        title: 'Create a New Entity',
        projects: projects
      });
    }
  });
}

/**
 * Create entity
 *
 */
exports.create = function(req, res) {
  var entityPro = req.body.project.split('.')[1],
      entityEnv = req.body.project.split('.')[0],
      entityName = req.body.entityName,
      entityDB = req.body.sourceDb,
      entityTable = req.body.sourceTable,
      entityCache = req.body.cache,
      options = {
        port: 8080,
        path: '/metadata?name=' + entityTable
      };

  Entity.get(entityName, function(err, entity) {
    if(err) {
    }
    if(entity) {
    }

    // Construct the new created entity
    var newEntity = new Entity(entityName, entityPro, entityDB,
      entityTable, entityCache, entityEnv);
    // Save the new entity
    newEntity.save(function(err, result) {
      if(result) {
        res.redirect('/edm');
        http.get(options, function (resp) {
          if (resp.statusCode === 200) {
            console.log('success');
          }
        });
      }
    });
  });
}

