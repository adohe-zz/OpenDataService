var fs = require('fs'),
	ctypto = require('crypto'),
	settings = require('../conf/settings'),
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

/**
 * Write the process id to file
 * @param {Number} pid
 */
exports.writePid = function(pid) {
	var pidfile = path.join(__dirname + settings.pidPath);
	fs.writeFileSync(pidfile, pid);
}

/**
 * Delete the pid file
 *
 */
exports.deletePid = function() {
	var pidfile = path.join(__dirname + settings.pidPath);
	if(fs.existsSync(pidfile)) {
		fs.unlinkSync(pidfile);
	}
}

/**
 * Authenticate the username&password
 * @param {String} username
 * @param {String} password
 * @param {Function} callback
 */
exports.authenticate = function(username, password, callback) {
	if(username === 'admin') {
		if(encrypt(password) === '<>') {
			callback(null, username);
		} else {
			callback(error('Auth Failed'), username);
		}
	}
}

/**
 * Encrypt the text use specific algorithm
 * @param {String} text
 * @return {String}
 */
exports.encrypt = function(text) {

	if(!arguments.length || text == '') return '';

	var cipher = crypto.createCipher(settings.algorithm, settings.key);
	var crypted = cipher.update(text, 'utf8', 'hex');
	crypted += cipher.final('hex');

	return crypted;
}

/**
 * Decrypt the text use specifc algorithm
 * @param {String} text
 * @return {String}
 *
 */
exports.decrypt = function(text) {

	if(!arguments.length || text == '') return '';
	var decipher = crypto.createDecipher(settings.algorithm, settings.key);
	var dec = decipher.update(text, 'hex', 'utf8');
	dec += decipher.final('utf8');

	return dec;
}
