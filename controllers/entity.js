/**
 * Create entity
 *
 */
exports.create = function(req, res) {
  res.render('newentity', {
    title: 'Create a New Entity'
  });
}

