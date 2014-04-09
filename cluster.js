var cluster = require('cluster'),
	numCPUs = require('os').cpus().length,
	logger = require('./config/log'),
	utils = require('./lib/utils');

//First write the pid to file
utils.writePid(process.pid);

//Set the child process working file
cluster.setupMaster({
	exec: 'server.js'
});

for(var i = 0; i < numCPUs; i++) {
	cluster.fork();
	logger.info('Cluster forked process, NO.' + i);
}

//Ctrl+C terminal the application
process.on('SIGINT', function() {
	logger.info('');
	sigint = true;
	process.exit(0);
});

//Called when kill process
process.on('SIGTERM', function() {
	utils.deletePid();
	process.exit(0);
});

process.on('SIGUSR2', function() {
	logger.info('SIGUSR2 received, reloading workers...');

	//delete the cached module, so we can reload our app
	delete require.cache[require.resolve('./app')];

	//only reload one worker at time,
	//otherwise, we'll have a time when no request handlers are running
	var i = 0;
	var workers = Object.keys(cluster.workers);
	var f = function() {
		if(i === workers.length)
			return;

		logger.info('Killing worker ' + workers[i]);
		cluster.workers[workers[i]].disconnect();
		cluster.workers[workers[i]].on('disconnect', function() {
			logger.info('worker disconnect completely');
		});
		var newWorker = cluster.fork();
		newWorker.on('listening', function() {
			logger.info('Replacement worker online...');
			i++;
			f();
		});
	}
	f();
});

//Emit when child process exit
cluster.on('exit', function(worker, code, signal) {
	logger.warn('worker ' + worker.process.id + ' died with code: ' + code);
	logger.info('Starting a new worker...');
	cluster.fork();
});

cluster.on('listening', function(worker, address) {
	logger.info('A new worker with #' + worker.process.id + ' is now connected to ' +
		address.address + ' : ' + address.port);
});
