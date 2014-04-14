var express = require('express'),
    partials = require('express-partials'),
    multipart = require('connect-multiparty'),
    log4js = require('log4js'),
    logger = require('./log');

module.exports = function(app, config) {

  app.set('showStackError', true);

  // should be placed before express.static
  //app.use(express.compress());

  // set static file location
  app.use(express.static(config.root + '/public'));

  // set view engine, view templates
  app.set('views', config.root + '/views');
  app.set('view engine', 'ejs');

  // set logger
  app.use(log4js.connectLogger(logger, {level: 'auto', format:':method :url'}));

  app.configure(function() {

    // cookie parser should above session
    app.use(express.cookieParser());

    // use urlencoded() and json() to fix connection3.0 warning
    app.use(express.urlencoded());
    app.use(express.json());
    app.use(multipart());
    app.use(express.methodOverride());
    app.use(partials());

    // routes should be at last
    app.use(app.router);
  });
}
