var express = require('express'),
	app = express(),
	partials = require('express-partials'),
	path = require('path'),
	log4js = require('log4js'),
	logger = require('./config/log');

//Development only
if('development' === app.get('env')) {
	app.use(express.errorHandler());
}

app.configure(function() {
	app.set('port', Number(process.argv[2]) || 8000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');

	app.use(express.favicon());
  app.use(log4js.connectLogger(logger, {level: 'auto', format:':method :url'}));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(partials());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.compress());
  app.use(app.router);
});

module.exports = app;
