module.exports = function(app, config) {

  app.use('/d.svc', $data.ODataServer({
    type: EDMSchema,
    CORS: true,
    database: config.db.name,
    responseLimit: -1,
    checkPermission: function(access, user, entitySets, callback) {
      callback.success();
    },
    provider: {
      name: 'mongoDB',
      databaseName: config.db.name,
      address: config.db.host,
      port: config.db.port,
      username: config.db.adminName,
      password: config.db.adminPwd
    }
  }));

}
