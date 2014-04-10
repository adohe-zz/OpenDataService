var site = require('../controllers/index');

module.exports = function(app) {

  app.get('/', site.index);

}
