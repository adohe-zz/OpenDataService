var cluster = require('cluster'),
	http = require('http'),
	numCPUs = require('os').cpus().length,
	logger = require('./config/log');

if(cluster.isMaster) {
	for(var i = 0; i < numCPUs; i++) {
		cluster.fork();
		console.log('Master fork worker NO ' + i);
	}

	cluster.on();

	cluster.on();
} else {

}
