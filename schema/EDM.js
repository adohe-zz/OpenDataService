var logger = require('../config/log'),
	Entity = require('./Entity'),
	utils = require('../lib/utils'),
	context;

logger.info('EDM generating...');
exports.init = function(config, callback) {
	context = {};
	Entity.getEntities(function(err, entities) {
		if(err)
			entities = [];
		logger.info('Total entity length: ' + entities.length);
		entities.forEach(function(entity) {
			logger.info('Entity Name: ' + entity.EntityName);
			var fullEntityName = utils.trim(entity.EntityName),
			    key = entity.EntityName + 's',
			    oentity = $data.Class.define(fullEntityName, $data.Entity, null, entity.Properties);

			// Define the odata entity context
			context[key] = {type: $data.EntitySet, elementType: oentity};
		});

		callback(null, context);
	});
}
