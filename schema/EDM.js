var logger = require('../config/log'),
	Entity = require('./Entity'),
	context;

logger.info('EDM generating...');
exports.init = function(callback) {
	context = {};
	Entity.get(null, function(err, entities) {
		if(err)
			entities = [];
		logger.info('Total entity length: ' + entities.length);
		entities.forEach(function(entity) {
			logger.info('Entity Name: ' + entity.EntityName);
			var fullEntityName = 'odata.' + entity.EntityName;
			var key = entity.EntityName + 's';

			//Define the odata entity
			var oentity = $data.Class.define(fullEntityName, $data.Entity, null, entity.Properties);
			context[key] = {type: $data.EntitySet, elementType: oentity};	
		});
		callback(null, context);
	});		
}
