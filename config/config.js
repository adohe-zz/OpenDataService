var path = require('path'),
    rootPath = path.normalize(__dirname + '/..');

module.exports = {
  development: {
    db: {
      name: 'odata',
      host: '127.0.0.1',
      port: '27017',
      adminName: 'odata'
    },
    root: rootPath,
    pidPath: 'run/app.pid'
  },
  test: {
  },
  production: {
  }
}
