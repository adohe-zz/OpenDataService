var site = require('../controllers/index');

module.exports = function(app) {

  //Index page
  app.get('/', site.index);

  //EDM page
  app.get('/edm', site.edm);
}
