var site = require('../controllers/index'),
    entity = require('../controllers/entity');

module.exports = function(app) {

  // Index page
  app.get('/', site.index);

  // EDM page
  app.get('/edm', site.edm);

  // Query page
  app.get('/query', site.query);

  // New entity page
  app.get('/newentity', entity.create);

}
