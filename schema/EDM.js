var logger = require('../config/log'),
	Entity = require('./Entity'),
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
			var fullEntityName = 'odata.' + entity.EntityName;
			var key = entity.EntityName + 's';

			//Define the odata entity
			var oentity = $data.Class.define(fullEntityName, $data.Entity, null, entity.Properties);
			context[key] = {type: $data.EntitySet, elementType: oentity};
		});

    var node = $data.Class.define('Node',$data.Entity,null, {
        "Name" : { type : "string",
          key : true,
          computed : false,
          nullable : false },
        "Count" : { type : "int" },
        "Status" : { type : "int" }
    });
    context['Nodes'] =  {type: $data.EntitySet, elementType: node};

    var link = $data.Class.define('Link',$data.Entity,null, {
        "Source" : { type : "int" },
        "Target" : { type : "int" },
        "Jump" : { type : "int" },
        "ReverseJump" : { type : "int" }
    });
    context['Links'] =  {type: $data.EntitySet, elementType: link};

		callback(null, context);
	});
}
