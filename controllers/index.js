/**
 *  Home page
 *
 */
exports.index = function(req, res) {
  res.render('index');
}

/**
 * EDM page
 *
 */
exports.edm = function(req, res) {
  console.log('here');
  res.render('edm');
}

/**
 * Query page
 *
 */
exports.query = function(req, res) {
  res.render('query');
}
