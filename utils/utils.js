/**
 * Generate an `Error` from the given status `code`
 * and optional `msg`.
 *
 * @param {Number} code
 * @param {String} msg
 * @return {Error}
 * @api private
 */
exports.error = function(code, msg) {
	var err = new Error(msg || code);
	err.status = code;
	return err;
}
