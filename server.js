var express = require('express'),
    logger = require('./config/log'),
    EDM = require('./schema/EDM');

require('odata-server');

var env = process.env.NODE_ENV || 'development',
    config = require('./config/config')[env];

logger.info('Init EDM schema...');
EDM.init(config, function(err, context) {
	if(err) {
		logger.error('Error: ' + err);
	}

	logger.info('context: ' + context);
	// Define context
	$data.Class.define('EDMSchema', $data.EntityContext, null, context, null);

	// Support ldap-auth in the feature
        var app = express();

	// Bootstrap Express setting
	logger.info('setup express server now...');
	require('./config/express')(app, config);

	// Bootstrap routes
	logger.info('configure routes...');
	require('./routes')(app);

        // Bootstrap OData server setting
        logger.info('setup odata server...');
        require('./config/odata')(app, config);

	//var connect = require('connect');
	var http = require('http');
	var fs = require('fs');

	/*logger.info('Setup HTTP Basic Authentication.');
	app.use('/d.svc', connect.basicAuth(username, password, fn) {
		utils.authenticate(username, password, function(err, username) {
			if(err) {
				fn(err, username);
			} else {
				fn(null, username);
			}
		});
	});*/

	// setup HTTP server
	logger.info('Setup HTTP Server and listen for request...');
	var port = process.env.PORT || 8000;
	var server = http.createServer(app);

	server.setTimeout(10 * 60 * 60 * 1000);

	server.listen(port, function() {
		console.log('The server started...');
	});
});
