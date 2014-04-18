var Entity = require('../schema/Entity');

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

