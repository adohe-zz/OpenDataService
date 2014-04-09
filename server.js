var logger = require('./config/log'),
	EDM = require('../schema/EDM');

require('odata-server');

var env = process.env.NODE_ENV || 'development',
    config = require('./config/config')[env];

logger.info('Init EDM schema...');
EDM.init(config, function(err, context) {
	if(err) {
		logger.error('Error: ' + err);
	}
	logger.info('context: ' + context);
	//Define context
	$data.Class.define('EDMSchema', $data.EntityContext, null, context, null);

	//Support ldap-auth in the feature

	logger.info('setup express server now...');
	var app = require('./lib/app');
	var routes = require('./routes');
	var connect = require('connect');
	var http = require('http');
	var https = require('https');
	var fs = require('fs');
	var utils = require('./utils/utils');
	var settings = require('./conf/settings');

	logger.info('Setup HTTP Basic Authentication.');
	app.use('/d.svc', connect.basicAuth(username, password, fn) {
		utils.authenticate(username, password, function(err, username) {
			if(err) {
				fn(err, username);
			} else {
				fn(null, username);
			}
		});
	});

	logger.info('Setup OData Server...');
	app.use('/d.svc', $data.ODataServer({
		type: EMDSchema,
		CORS: true,
		database: 'odata',
		responseLimit: -1,
		checkPermission: function(access, user, entitySets, callback) {

		},
		provider: {
			name: 'mongoDB',
			databaseName: 'odata',
			address: settings.dbHost,
			port: settings.dbPort,
			username: settings.dbAdminName,
			password: settings.dbAdminPassword
		}
	}));

	logger.info('Setup HTTP Server and listen for request...');
	var server = http.createServer(app);

	server.setTimeout(10 * 60 * * 60 * 1000);

	server.listen(app.get('port'), function() {
		console.log('The server started...');
	});

	routes(app);
});
