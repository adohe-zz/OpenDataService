var log4js = require('log4js');
log4js.configure({
	appenders: [
		{type: 'console'},
		{
			type: 'file',
			filename: './logs/ods.log',
			maxLogSize: 10240,
			backups: 365,
			category: 'normal'
			
		}
	],
	replaceConsole: true
});

var logger = log4js.getLogger('normal');
logger.setLevel('');

exports = module.exports = logger;
