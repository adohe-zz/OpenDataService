var site = require('../controllers/index'),
    entity = require('../controllers/entity'),
    project = require('../controllers/project');

module.exports = function(app) {

  // Index page
  app.get('/', site.index);

  // EDM page
  app.get('/edm', site.edm);

  // Admin page
  app.get('/admin', site.admin);

  // Query builder page
  app.get('/query', site.query);

  // New entity page
  app.get('/entity', entity.index);

  // Create project
  app.post('/project', project.create);

  // Create entity
  app.post('/entity', entity.create);

  // Upload page
  app.get('/upload', site.upload);

  // Sync data
  app.get('/sync', site.sync);

}
