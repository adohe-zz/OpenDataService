var Project = require('../schema/Project');

/**
 * Create project
 *
 */
exports.create = function(req, res) {
  var projectName = req.body.name,
      projectPrefix = req.body.prefix,
      projectOwner = req.body.owner,
      projectEnv = req.body.env;

  Project.get(projectName, function(err, pro) {
    if(pro) {

    }
    if(err) {
    }

    var project = new Project({
      name: projectName,
      prefix: projectPrefix,
      env: projectEnv,
      owner: projectOwner
    });
    // Save the project
    project.save(function(err, result) {
      if(result) {
        res.writeHead(200);
        res.end();
      } else {
      }
    });
  });
}
