var setting = require('../conf/settings'),
    db = require('../conf/db'),
    should = require('mocha').should(),
    mongodb = require('mongodb'),
    Server = mongodb.Server,
    MongoClient = mongodb.MongoClient;

var mongoClient = new MongoClient(new Server(setting.dbHost, setting.dbPort));

describe('db.test.js', function() {
  //Test open connection
  it('should establish a connection when the setting is right', function(done) {
    db.open(function(err, db) {
      should.not.exist(err);
      should.exist(db);
      db.should.be.an('object');
      mongodb.close();
      done();
    });
  });

  //Test authenticate
  it('should pass the authentication when use correct name&password', function(done) {
    mongoClient.open(function(err, mongoClient) {
      var db = mongoClient.db('odata');
      db.authenticate(setting.dbAdminName, setting.dbAdminPwd, function(err, result) {
        should.not.exist(err);
        should.equal(true, result);

        db.close();
        mongoClient.close();
        done();
      });
    });
  });
});
