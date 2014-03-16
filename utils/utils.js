var fs = require('fs'),
	path = require('path');

/**
 * Generate an `Error` from the given status `code`
 * and optional `msg`.
 *
 * @param {Number} code
 * @param {String} msg
 * @return {Error}
 */
exports.error = function(code, msg) {
	var err = new Error(msg || code);
	err.status = code;
	return err;
}

/*
 * Write the process id to file
 * @param {Number} pid
 */
exports.writePid = function(pid) {
	var pidfile = path.join(__dirname + 'run/app.pid');
	fs.writeFileSync(pidfile, pid);
}

/*
 * Delete the pid file
 *
 */
exports.deletePid = function() {
	var pidfile = path.join(__dirname + 'run/app.pid');
	if(fs.existsSync(pidfile)) {
		fs.unlinkSync(pidfile);
	}
}
