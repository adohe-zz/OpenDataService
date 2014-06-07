var Entity = require('../schema/Entity'),
    http = require('http'),
    url = require('url');

/**
 *  Home page
 *
 */
exports.index = function (req, res) {
  res.render('index');
}

/**
 * Upload file page
 *
 */
exports.upload = function (req, res) {
  res.render('upload');
}

/**
 *
 *
 */
exports.admin = function (req, res) {
  res.render('admin');
}

/**
 * EDM page
 *
 */
exports.edm = function (req, res) {
  Entity.getEntities(function(err, entities) {
    if(err) {
    } else {
      res.render('edm', {
        entities: entities
      });
    }
  });
}

/**
 * Query Builder page
 *
 */
exports.query = function (req, res) {
  res.render('query');
}

/**
 * Visualization page
 *
 */
exports.vi = function (req, res) {
  res.render('visualization');
}

/**
 * Sync data
 *
 */
exports.sync = function (req, res) {
  var query = url.parse(req.url, true).query,
      table = query.name,
      collection = query.collection,
      entityName = collection.substring(0, collection.length - 1),
      options = {
        port: 8080,
        path: '/data?name=' + table + '&collection=' + collection
      };

  Entity.get(entityName, function (err, doc) {
    if (doc.Status === 'completed') {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('Sync already finished....');
    } else {
      http.get(options, function (resp) {
        if (resp.statusCode === 200) {
          console.log('sync data finished...');
        }
      });
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('Sync data start....');
    }
  });
}
