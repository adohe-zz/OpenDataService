var logger = require('logger'),
	EDM = require('../schema/EDM');

require('odata-server');

logger.info('Init EDM schema...');
EDM.init(function(err, context) {
	if(err) {
		logger.error('Error: ' + err);
	}
	logger.info('context: ' + context);
	//Define context
	$data.Class.define('EDMSchema', $data.EntityContext, null, context, null);

	//Support ldap-auth in the feature
	
	logger.info('setup express server now...');
	var app = require('./app');
	var routes = require('./routes');
	var connect = require('connect');
	var http = require('http');
	var https = require('https');
	var fs = require('fs');

	logger.info('Setup HTTP Basic Authentication.');
	app.use('/d.svc', connect.bas)
});
