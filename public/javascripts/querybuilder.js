//Declare the namespace, we use the OData namespace defined
//in the datajs
var OData = OData || {};
OData.explorer = OData.explorer || {};
OData.explorer.constants = OData.explorer.constants || {};


//Define some constants
OData.explorer.constants.defaultTop = 20;
OData.explorer.constants.defaultSkip = 50;
OData.explorer.constants.defaultErrorMessageDuration = 1;

/// <summary>
/// Extends the built in String class with a format function if one is not already defined.
/// <code>
/// var input = '{0} and {1}';
/// var output = input.format('you', 'I') = 'you and I'
/// </code>
/// </summary>
if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

//Clean the odata endpoint url
OData.explorer._cleanODataEndpointUrl = function(url) {
	var metadata = '$metadata';

	if(url.indexOf(metadata, url.length - metadata.length) !== -1) {
		url.replace(metadata, '');
	}

	if(url[url.length - 1] !== '/') {
		url += '/';
	}
	
	return url;
};

OData.extend = function(base, child) {
	var f = function() {};
	f.prototype = base.prototype;
	child.prototype = new f();
	child.prototype.constructor = child;
	child.base = base.prototype;
	return child;
}

/// <summary>
/// Where clause filter options base class.
/// </summary>
OData.explorer.FilterOptions = function () {
    this.values = [];
};

/// <summary>
/// Gets the filter options.
/// </summary>
/// <returns type="Array">An array with the filter objects.</returns>
OData.explorer.FilterOptions.prototype.getFilterOptions = function () {
    return this.values;
};

/// <summary>
/// Gets the where query.
/// Queries we want to be able to generate (examples):
/// Orders?$filter=startswith(Employee/FirstName, 'A') eq true
/// Orders?$filter=Employee/FirstName ne 'A'
/// Regions?$filter=Territories/any(x: x/RegionID eq 1)
/// Regions?$filter=Territories/any(x: substringof('so', x/TerritoryDescription) eq true)
/// </summary>
/// <param name="propertiesListNames">The list of property names.</param>
/// <param name="filterId">The id of the filter.</param>
/// <param name="value">The value of the property.</param>
/// <param name="propertiesListMultiplicityIsTrue">Multiplicity check.</param>
/// <returns type="String">The query string for the specified where filter.</returns>
OData.explorer.FilterOptions.prototype.getWhereQuery = function (propertiesListNames, filterId, value, propertiesListMultiplicityIsTrue) {
    if (!propertiesListNames || propertiesListNames.length === 0) {
        return '';
    }

    // Clean the input value by doubling the single ' with another one before and finally by escaping it.
    // Example: alert( escape("http://hello ' world") ); // displays: http%3A//hello%20%27%27%20world
    // First replace all the ' with '' (not ").
    value = String(value).replace(new RegExp("'", 'g'), "''");
    // Finally escape the value.
    value = escape(value);

    var filter = this.values[filterId];

    if (typeof propertiesListNames === 'string' || propertiesListNames.length == 1) {
        // We have only one property.
        return filter.stringFormat.format(propertiesListNames, value);
    }

    // We are handling navigation properties.
    var lastProperty = propertiesListNames[propertiesListNames.length - 1];
    var secondLastElementIndex = propertiesListNames.length - 2; // We previously checked that the length is >= 2
    var query = lastProperty;

    // Check if the previous navigation property has multiplicity, to know if we need to add the x/ or not.
    if (propertiesListMultiplicityIsTrue[secondLastElementIndex]) {
        query = 'x/' + query;
    }

    // Goal: Orders?$filter=startswith(Employee/FirstName, 'A') eq true
    // While the navigations have a 1:1 multiplicity, keep recursing and adding them because the function filter
    // has to be added only at the end.
    while (secondLastElementIndex >= 0 && !propertiesListMultiplicityIsTrue[secondLastElementIndex]) {
        query = this.createNavigationNoMultiplicityWhereQuery(propertiesListNames[secondLastElementIndex], query);
        secondLastElementIndex--;
    }

    // Done building the "Employee/FirstName" now add the filter startswith([...], 'A') eq true
    query = filter.stringFormat.format(query, value);

    // Keep adding the rest of the properties
    for (var i = secondLastElementIndex; i >= 0; i--) {
        if (propertiesListMultiplicityIsTrue[i]) {
            query = this.createNavigationAnyWhereQuery(propertiesListNames[i], query);
        } else {
            query = this.createNavigationNoMultiplicityWhereQuery(propertiesListNames[i], query);
        }
    }

    return query;
};

/// <summary>
/// Creates an "in any" where query clause against a navigation property.
/// e.g. Foo.svc/Bar?$filter=Users/any(x: x/IsHappy eq true)
/// </summary>
/// <param name="navigationProperty">The property name.</param>
/// <param name="propertyWhereQuery">The desired value(s) of the property.</param>
/// <returns type="String">Part of the query string for that specific navigation property.</returns>
OData.explorer.FilterOptions.prototype.createNavigationAnyWhereQuery = function (navigationProperty, propertyWhereQuery) {
    return navigationProperty + '/any(x: ' + propertyWhereQuery + ')';
};

/// <summary>
/// Creates a basic where query clause against a navigation property.
/// e.g. Foo.svc/Bar?$filter=Users/Name ne 'a'
/// </summary>
/// <param name="navigationProperty">The property name.</param>
/// <param name="propertyWhereQuery">The desired value of the property.</param>
/// <returns type="String">Part of the query string for that specific property.</returns>
OData.explorer.FilterOptions.prototype.createNavigationNoMultiplicityWhereQuery = function (navigationProperty, propertyWhereQuery) {
    return navigationProperty + '/' + propertyWhereQuery;
};

/// <summary>
/// Null where clause filter class.
/// </summary>
OData.explorer.NullFilterOptions = OData.extend(OData.explorer.FilterOptions, function () {
    this.values = [
           { errorMessage: 'You are not able to query on this property.' }
    ];
});

/// <summary>
/// Gets the where query, which for null is an empty string.
/// </summary>
OData.explorer.NullFilterOptions.prototype.getWhereQuery = function () {
    return '';
};

/// <summary>
/// Boolean where clause filter class.
/// </summary>
OData.explorer.BooleanFilterOptions = OData.extend(OData.explorer.FilterOptions, function () {
    this.values = [
            { displayName: 'is true', stringFormat: '{0} eq true', inputType: false },
            { displayName: 'is false', stringFormat: '{0} eq false', inputType: false }
    ];
});

/// <summary>
/// FloatingPoint where clause filter class.
/// </summary>
OData.explorer.FloatingPointFilterOptions = OData.extend(OData.explorer.FilterOptions, function () {
    this.values = [
            { displayName: 'round equals', stringFormat: 'round({0}) eq {1}', inputType: 'int' },
            { displayName: 'floor equals', stringFormat: 'floor({0}) eq {1}', inputType: 'int' },
            { displayName: 'ceiling equals', stringFormat: 'ceiling({0}) eq {1}', inputType: 'int' },
            { displayName: 'equals', stringFormat: '{0} eq {1}', inputType: 'double' },
            { displayName: 'not equals', stringFormat: '{0} ne {1}', inputType: 'double' },
            { displayName: 'greater than', stringFormat: '{0} gt {1}', inputType: 'double' },
            { displayName: 'greater than or equal to', stringFormat: '{0} ge {1}', inputType: 'double' },
            { displayName: 'less than', stringFormat: '{0} lt {1}', inputType: 'double' },
            { displayName: 'less than or equal to', stringFormat: '{0} le {1}', inputType: 'double' }
    ];
});

/// <summary>
/// Integer where clause filter class.
/// </summary>
OData.explorer.IntegerFilterOptions = OData.extend(OData.explorer.FilterOptions, function () {
    this.values = [
            { displayName: 'equals', stringFormat: '{0} eq {1}', inputType: 'int' },
            { displayName: 'not equals', stringFormat: '{0} ne {1}', inputType: 'int' },
            { displayName: 'greater than', stringFormat: '{0} gt {1}', inputType: 'int' },
            { displayName: 'greater than or equal to', stringFormat: '{0} ge {1}', inputType: 'int' },
            { displayName: 'less than', stringFormat: '{0} lt {1}', inputType: 'int' },
            { displayName: 'less than or equal to', stringFormat: '{0} le {1}', inputType: 'int' }
    ];
});

/// <summary>
/// Date and time where clause filter class.
/// </summary>
OData.explorer.DateTimeFilterOptions = OData.extend(OData.explorer.FilterOptions, function () {
    this.values = [
            {
                displayName: 'before',
                stringFormat: "{0} le datetime'{1}'",
                inputType: false,
                inputTypeOptions: ['now', 'yesterday', 'a week ago', 'a month ago', 'tomorrow', 'next week', 'next month']
            },
            {
                displayName: 'after',
                stringFormat: "{0} ge datetime'{1}'",
                inputType: false,
                inputTypeOptions: ['now', 'yesterday', 'a week ago', 'a month ago', 'tomorrow', 'next week', 'next month']
            },
            { displayName: 'year equals', stringFormat: 'year({0}) eq {1}', inputType: 'int' },
            { displayName: 'month number equals', stringFormat: 'month({0}) eq {1}', inputType: 'int' },
            { displayName: 'day number equals', stringFormat: 'day({0}) eq {1}', inputType: 'int' },
            { displayName: 'hour equals', stringFormat: 'hour({0}) eq {1}', inputType: 'int' },
            { displayName: 'minute equals', stringFormat: 'minute({0}) eq {1}', inputType: 'int' },
            { displayName: 'second equals', stringFormat: 'second({0}) eq {1}', inputType: 'int' }
    ];
});

/// <summary>
/// Gets the where query for DateTime objects.
/// </summary>
/// <param name="propertiesListNames">The list of property names.</param>
/// <param name="filterId">The id of the filter.</param>
/// <param name="value">The value of the property.</param>
/// <param name="propertiesListMultiplicityIsTrue">Multiplicity check.</param>
OData.explorer.DateTimeFilterOptions.prototype.getWhereQuery = function (propertiesList, filterId, value, propertiesListMultiplicityIsTrue) {
    switch (parseInt(filterId)) {
        case 0:
        case 1: {
            var time = new Date();
            var now = new Date();

            switch (parseInt(value)) {
                case 0: // now
                    break;
                case 1: // yesterday
                    time.setDate(now.getDate() - 1);
                    break;
                case 2: // a week ago
                    time.setDate(now.getDate() - 7);
                    break;
                case 3: // a month ago
                    time.setMonth(now.getMonth() - 1);
                    break;
                case 4: // tomorrow
                    time.setDate(now.getDate() + 1);
                    break;
                case 5: // next week
                    time.setDate(now.getDate() + 7);
                    break;
                case 6: // next month
                    time.setMonth(now.getMonth() + 1);
                    break;
                default:
                    return OData.explorer.DateTimeFilterOptions.base.getWhereQuery.call(
                        this, propertiesList, filterId, value, propertiesListMultiplicityIsTrue);
            }

            return OData.explorer.DateTimeFilterOptions.base.getWhereQuery.call(
                this, propertiesList, filterId, time.toISOString(), propertiesListMultiplicityIsTrue);
        }
    }

    return OData.explorer.DateTimeFilterOptions.base.getWhereQuery.call(
        this, propertiesList, filterId, value, propertiesListMultiplicityIsTrue);
};

/// <summary>
/// GUID where clause filter class.
/// </summary>
OData.explorer.GuidFilterOptions = OData.extend(OData.explorer.FilterOptions, function () {
    this.values = [
            { displayName: 'equals', stringFormat: "{0} eq guid'{1}'", inputType: 'guid' },
            { displayName: 'not equals', stringFormat: "{0} ne guid'{1}'", inputType: 'guid' }
    ];
});

/// <summary>
/// String where clause filter class.
/// </summary>
OData.explorer.StringFilterOptions = OData.extend(OData.explorer.FilterOptions, function () {
    this.values = [
            { displayName: 'equals', stringFormat: "{0} eq '{1}'", inputType: 'string' },
            { displayName: 'not equals', stringFormat: "{0} ne '{1}'", inputType: 'string' },
            { displayName: 'case-insensitive equals', stringFormat: "tolower({0}) eq tolower('{1}')", inputType: 'string' },
            { displayName: 'case-insensitive does not equal', stringFormat: "tolower({0}) eq tolower('{1}')", inputType: 'string' },
            { displayName: 'starts with', stringFormat: "startswith({0}, '{1}') eq true", inputType: 'string' },
            { displayName: 'does not start with', stringFormat: "startswith({0}, '{1}') eq false", inputType: 'string' },
            { displayName: 'ends with', stringFormat: "endswith({0}, '{1}') eq true", inputType: 'string' },
            { displayName: 'does not end with', stringFormat: "endswith({0}, '{1}') eq false", inputType: 'string' },
            { displayName: 'contains', stringFormat: "substringof('{1}', {0}) eq true", inputType: 'string' },
            { displayName: 'has length', stringFormat: "length({0}) eq {1}", inputType: 'int' }
    ];
});

/// <summary>
/// Where clause filter class.
/// </summary>
OData.explorer.WhereFilterOptions = function () {
    this['Null'] = new OData.explorer.NullFilterOptions();
    this['Edm.Boolean'] = new OData.explorer.BooleanFilterOptions();
    this['Edm.Decimal'] =
        this['Edm.Single'] =
        this['Edm.Double'] = new OData.explorer.FloatingPointFilterOptions();
    this['Edm.Byte'] =
        this['Edm.SByte'] =
        this['Edm.Int16'] =
        this['Edm.Int32'] =
        this['Edm.Int64'] = new OData.explorer.IntegerFilterOptions();
    this['Edm.Time'] =
        this['Edm.DateTime'] =
        this['Edm.DateTimeOffset'] = new OData.explorer.DateTimeFilterOptions();
    this['Edm.Guid'] = new OData.explorer.GuidFilterOptions();
    this['Edm.String'] = new OData.explorer.StringFilterOptions();
};

/// <summary>
/// Where clause filter class.
/// </summary>
OData.explorer.WhereFilterOptions.prototype.getFilterHandler = function (type) {
    if (this[type]) {
        return this[type];
    } else {
        return this.Null;
    }
};

//OData query builder
OData.explorer.QueryBuilder = function(endpointUrl, metadataInput) {
	if(!endpointUrl) {
		throw 'you must specify the endpoint url';
	}

	this.multiplicityValues = ["0..1", "1", "*"];
	this.maxNavigationRecursion = 1;

	//Metadata
	this.metadata = metadataInput;
	this.entities = null;
	this.association = null;
	this.namespace = null;
	this.entitySchema = null;
	this.entitySet = null;
	this.associationSet = null;

	//Query variables
	this.oDataUrl = OData.explorer._cleanODataEndpointUrl(endpointUrl);
	this.top = null;
	this.skip = null;
	this.selectedEntityId = null;
	this.whereFilterId = 0;
	this.whereFilter = [];
	this.orderByPropertyList = [];
	this.selectPropertyList = [];
	this.format = 'json';
	this.filterOptions = new OData.explorer.WhereFilterOptions();

	if(this.metadata) {
		this._updateMetadata(this.metadata);
	}
};

//Get the odata service url
OData.explorer.QueryBuilder.prototype.getODataUrl = function() {
	return this.oDataUrl;
};

/**
 *Update the metadata based on the user input metadta
 *actually this method will not be used
 */
OData.explorer.QueryBuilder.prototype._updateMetadata = function(someMetadata) {
	this.metadata = someMetadata;

	for(var e in this.metadata.dataServices.schema) {
		var schema = this.metadata.dataServices.schema[e];

		if(schema.entityType) {
			this.entities = schema.entityType;
			this.association = schema.association;
			this.namespace = schema.namespace;
		}

		if(schema.entityContainer) {
			this.entitySchema = schema;
			this.entitySet = schema.entityContainer[0].entitySet;
			this.associationSet = schema.entityContainer[0].associationSet;
		}

		this.selectedEntityId = null;
		this.whereFilterId = 0;
		this.whereFilter = [];
		this.orderByPropertyList = [];
		this.selectPropertyList = [];
	}
};

//Initialize the query builder which return a promise
OData.explorer.QueryBuilder.prototype.initialize = function() {
	var deferred = $.Deferred();
	if(!this.metadata) {
		//Request the metadata from our data service
		OData.read({requestUri: this.getODataUrl() + '$metadata'},
			$.proxy(function(data) {
				this.metadata = data;
				this._updateMetadata(this.metadata);
				deferred.resolve();
			}, this),
			//Error Callback
			function(err) {
				var error = JSON.stringify(err);
				deferred.reject(error);
			}, OData.metadataHandler);
	} else {
		deferred.resolve();
	}

	return deferred;
};

OData.explorer.QueryBuilder.prototype.setTop = function(value) {
	this.top = isNaN(parseInt(value))? null : parseInt(value);
};

OData.explorer.QueryBuilder.prototype.setSkip = function(value) {
	this.skip = isNaN(parseInt(value)) ? null : parseInt(value);
};

OData.explorer.QueryBuilder.prototype.setFormat = function(value) {
	this.format = value;
};

OData.explorer.QueryBuilder.prototype.setSelectedEntityId = function(id) {
	this.selectedEntityId = id;
};

OData.explorer.QueryBuilder.prototype.getSelectedEntityId = function() {
	return this.selectedEntityId;
};

OData.explorer.QueryBuilder.prototype.emptyWhereFilters = function() {
	this.whereFilter = [];
};

OData.explorer.QueryBuilder.prototype.clearOrderByProperty = function() {
	this.orderByPropertyList = [];
};

OData.explorer.QueryBuilder.prototype.clearSelectProperty = function() {
	this.selectPropertyList = [];
};

OData.explorer.QueryBuilder.prototype.setOrderByProperty = function(propertyId, val) {
	if(val != 0 || val != 1 || val != 2) {
	}

	// Try to see if the property is already in the array.
    for (var i in this.orderByPropertyList) {
        if (this.orderByPropertyList[i].propertyId == propertyId) {
            // Remove the property from the array.
            if (val == 0) {
                this.orderByPropertyList.splice(i, 1);
            } else { // Change the value of the property in the array.
                this.orderByPropertyList[i].value = val;
            }
            return;
        }
    }

    // Add new one.
    var orderByClause = {
        propertyId: propertyId,
        value: val
    };

    this.orderByPropertyList.push(orderByClause);
};

OData.explorer.QueryBuilder.prototype.setSelectProperty = function(propertyId, val) {
	if(val != 0 || val != 1) {
	}

	for(var i in this.selectPropertyList) {
		if(this.selectPropertyList[i].propertyId == propertyId) {
			if(val == 0) {
				this.selectPropertyList.splice(i, 1);
			} else {
				this.selectPropertyList[i].value = val;
			}

			return;
		}
	}

	var selectClause = {
		propertyId: propertyId,
		value: val
	};

	this.selectPropertyList.push(selectClause);
};

//Get the entities list
OData.explorer.QueryBuilder.prototype.getEntitiesNames = function() {
	var entitiesNames = this._getNamesValueFromEntities(this.entities); 

	var filteredEntitiesNames = [];

	for(var i = 0, l = entitiesNames.length; i < l; i++) {
		if(!entitiesNames[i].entity.abstract) {
			filteredEntitiesNames.push(entitiesNames[i]);
		}
	}

	return filteredEntitiesNames;
};

/// <summary>
/// Return the properties and navigation properties.
/// </summary>
/// <param name ="entityId" type="Integer">The entity id.</param>
/// <param name ="onlyProperties" type="Boolean">If true it will not return navigation properties.</param>
/// <returns type="Array">An array with the properties and navigation properties (if onlyProperties != false).</returns>
OData.explorer.QueryBuilder.prototype.getQueryPropertiesAndNavigationPropertiesForEntity = function (entityId, onlyProperties) {
    var keys = [];
    var index = 0;

    var properties = this._getPropertyNamesForEntity(entityId);
    for (var i = 0, l = properties.length; i < l; i++) {
        keys.push({
            key: index++,
            value: properties[i].value,
            id: properties[i].key,
            type: "property"
        });
    }

    if (!onlyProperties) {
        var navigationProps = this._getNavigationPropertyNamesForEntity(entityId);
        for (var i = 0, l = navigationProps.length; i < l; i++) {
            keys.push({
                key: index++,
                value: navigationProps[i].value,
                id: navigationProps[i].key,
                type: "navigationProperty"
            });
        }
    }

    return keys.sort(this._sortDictionaryByValueComparator);
};

/// <summary>
/// Compare the two objects by value
/// </summary>
/// <param name ="element1" type="Object">The first element.</param>
/// <param name ="element2" type="Object">The second element.</param>
/// <returns type="Integer">-1 if the first element comes first, 0 if they have the same value, 1 otherwise.</returns>
OData.explorer.QueryBuilder.prototype._sortDictionaryByValueComparator = function (element1, element2) {
    var a = element1.value;
    var b = element2.value;

    return a < b ? -1 : (a > b ? 1 : 0);
};

/// <summary>
/// Return the property or navigation property with the specified id.
/// </summary>
/// <param name ="entityId" type="Integer">The entity id.</param>
/// <param name ="propOrNavPropId" type="Integer">The property or navigation property id.</param>
/// <returns type="Array">The property or navigation property.</returns>
OData.explorer.QueryBuilder.prototype.getQueryPropertiesAndNavigationPropertiesFromQueryId = function (entityId, propOrNavPropId) {
    var keys = this.getQueryPropertiesAndNavigationPropertiesForEntity(entityId);

    for (var i = keys.length - 1; i >= 0; i--) {
        if (keys[i].key == propOrNavPropId) {
            return keys[i];
        }
    }

    return undefined;
};

/// <summary>
/// Return the keys for the entity.
/// </summary>
/// <param name ="entityId" type="Integer">The entity id.</param>
/// <returns type="Array">The entity's keys.</returns>
OData.explorer.QueryBuilder.prototype.getKeysForEntity = function (entityId) {
    var e = this.entities[entityId];
    var keys = e.key.propertyRef;

    return this._getNamesValueFromObject(keys);
};

/// <summary>
/// Return the where filters formatted for the final OData query url.
/// </summary>
/// <param name ="whereFilterList" type="Array">A list of all the query filters.</param>
/// <returns type="String">The where filters formatted for the final OData query url.</returns>
OData.explorer.QueryBuilder.prototype._getWhereQueryFilter = function (whereFilterList) {
    var result = '';

    for (var i = 0, l = whereFilterList.length; i < l; i++) {
        var filter = whereFilterList[i];
        var propertyListNames = filter.propertyListNames;
        var propertiesListIds = filter.propertiesListIds;
        var propListReferringEntityIds = filter.propertyListReferringEntityIds;
        var lastPropName = propertyListNames[propertyListNames.length - 1];
        var lastPropReferringEntityId = propListReferringEntityIds[propListReferringEntityIds.length - 1];

        var propertiesListMultiplicityIsTrue = [];
        for (var k = 0, t = propertiesListIds.length; k < t; k++) {
            var referringEntityId = propListReferringEntityIds[k];
            var id = propertiesListIds[k];
            var element = this.getQueryPropertiesAndNavigationPropertiesFromQueryId(referringEntityId, id);

            switch (element.type) {
                case 'navigationProperty':
                    var navigationProperty = this._getNavigationPropertyForEntity(referringEntityId, element.id);
                    var multiplicity = this._getNavigationPropertyMultiplicity(navigationProperty);
                    if (multiplicity <= 1) {
                        propertiesListMultiplicityIsTrue.push(false);
                    } else {
                        propertiesListMultiplicityIsTrue.push(true);
                    }
                    break;
                case 'property':
                    // Properties do not have multiplicity, because they are not navigations.
                    propertiesListMultiplicityIsTrue.push(false);
                    break;
            }
        }

        var prop = this._getPropertyForEntityFromName(lastPropReferringEntityId, lastPropName);
        var aQuery = this.filterOptions.getFilterHandler(prop.type).getWhereQuery(
            propertyListNames, filter.propertyFilterId, filter.value, propertiesListMultiplicityIsTrue);

        result += aQuery;

        if (i < l - 1) {
            result += ' and ';
        }
    }

    return result;
};

/// <summary>
/// Return the acceptable properties for the entity, including also the base classes properties.
/// </summary>
/// <param name ="entityId" type="Integer">The entity id.</param>
/// <returns type="Array">The entity's properties.</returns>
OData.explorer.QueryBuilder.prototype._getAcceptableProperties = function (entityId) {
    var e = this.entities[entityId];
    var properties = e.property || [];

    // If it is a hierarchical entity add the base classes' properties.
    if (e.baseType) {
        var baseEntityName = e.baseType.replace(this.namespace + '.', '');
        var baseEntityId = this._getEntityIdByName(baseEntityName);
        var baseProperties = this._getAcceptableProperties(baseEntityId);

        properties = properties.concat(baseProperties);
    }

    return properties;
};

OData.explorer.QueryBuilder.prototype._getNamesValueFromObject = function(obj) {
	var keys = [];
	for(var i in obj) {
		keys.push({key: i, value: obj[i].name, object: obj[i]});
	}

	return keys;
};

/// <summary>
/// Return the property names.
/// </summary>
/// <param name ="entityId" type="Integer">The entity id.</param>
/// <returns type="Array">The entity's properties' names.</returns>
OData.explorer.QueryBuilder.prototype._getPropertyNamesForEntity = function (entityId) {
    var properties = this._getAcceptableProperties(entityId);

    return this._getNamesValueFromObject(properties);
};

/// <summary>
/// Return the property.
/// </summary>
/// <param name ="entityId" type="Integer">The entity id.</param>
/// <param name ="propertyId" type="Integer">The property id.</param>
/// <returns type="Object">The entity's property.</returns>
OData.explorer.QueryBuilder.prototype._getPropertyForEntity = function (entityId, propertyId) {
    var properties = this._getAcceptableProperties(entityId);

    return properties[propertyId];
};

/// <summary>
/// Return the property with the specified property name.
/// </summary>
/// <param name ="entityId" type="Integer">The entity id.</param>
/// <param name ="propertyName" type="String">The property name.</param>
/// <returns type="Object">The entity's property.</returns>
OData.explorer.QueryBuilder.prototype._getPropertyForEntityFromName = function (entityId, propertyName) {
    var properties = this._getAcceptableProperties(entityId);

    for (var i = properties.length - 1; i >= 0; i--) {
        if (properties[i].name === propertyName) {
            return properties[i];
        }
    }

    return undefined;
};

/// <summary>
/// Return the filter options for the property.
/// </summary>
/// <param name ="entityId" type="Integer">The entity id.</param>
/// <param name ="propId" type="Integer">The property id.</param>
/// <returns type="Object">The filter options.</returns>
OData.explorer.QueryBuilder.prototype.getFilterOptionsForProperty = function (entityId, propId) {
    var properties = this._getAcceptableProperties(entityId);
    var prop = properties[propId];

    return this.filterOptions.getFilterHandler(prop.type).getFilterOptions();
};

/// <summary>
/// Return the acceptable navigation properties for the entity, including also the base classes properties
/// </summary>
/// <param name ="entityId" type="Integer">The entity id.</param>
/// <returns type="Array">The entity's navigation properties.</returns>
OData.explorer.QueryBuilder.prototype._getAcceptableNavigationProperties = function (entityId) {
    var e = this.entities[entityId];
    var navigationProperties = e.navigationProperty || [];

    // If it is a hierarchical entity add the base classes' properties.
    if (e.baseType) {
        var baseEntityName = e.baseType.replace(this.namespace + '.', '');
        var baseEntityId = this._getEntityIdByName(baseEntityName);
        var baseNavigationProperties = this._getAcceptableNavigationProperties(baseEntityId);

        navigationProperties = navigationProperties.concat(baseNavigationProperties);
    }

    return navigationProperties;
};

/// <summary>
/// Return the navigation property names.
/// </summary>
/// <param name ="entityId" type="Integer">The entity id.</param>
/// <returns type="Array">The entity's navigation properties.</returns>
OData.explorer.QueryBuilder.prototype._getNavigationPropertyNamesForEntity = function (entityId) {
    var navigationProperties = this._getAcceptableNavigationProperties(entityId);

    return this._getNamesValueFromObject(navigationProperties);
};

/// <summary>
/// Return the navigation property.
/// </summary>
/// <param name ="entityId" type="Integer">The entity id.</param>
/// <param name ="navPropId" type="Integer">The navigation property id.</param>
/// <returns type="Object">The entity's navigation property.</returns>
OData.explorer.QueryBuilder.prototype._getNavigationPropertyForEntity = function (entityId, navPropId) {
    var navigationProperties = this._getAcceptableNavigationProperties(entityId);

    return navigationProperties[navPropId];
};

/// <summary>
/// Return the navigation property's entity id that it is referring to.
/// </summary>
/// <param name ="entityId" type="Integer">The entity id.</param>
/// <param name ="navPropId" type="Integer">The navigation property id.</param>
/// <returns type="Object">The entity id.</returns>
OData.explorer.QueryBuilder.prototype.getNavigationPropertyReferringEntityId = function (entityId, navPropId) {
    var navigationProperty = this._getNavigationPropertyForEntity(entityId, navPropId);

    return this._getReferringEntityIdFromNavigationProperty(navigationProperty);
};

/// <summary>
/// Return the final OData query url.
/// </summary>
/// <returns type="String">The query url.</returns>
OData.explorer.QueryBuilder.prototype.getGeneratedODataQueryUrl = function () {
    var url = this.getODataUrl();

    // 0 is an acceptable value therefore we need to compare it like this.
    if (typeof this.selectedEntityId !== "undefined" && this.selectedEntityId != null) {
        var entityQueryName = this._getEntityQueryName(this.selectedEntityId);

        if (typeof entityQueryName === "undefined") {
            throw 'Invalid entity selected with id: ' + this.selectedEntityId;
        }

        url += entityQueryName + '?';
    }

	if(typeof this.format !== "undefined" && this.format != null) {
		url += '$format=' + this.format + '&';
	}

    if (typeof this.skip !== "undefined" && this.skip != null) {
        url += '$skip=' + this.skip + '&';
    }

    if (typeof this.top !== "undefined" && this.top != null) {
        url += '$top=' + this.top + '&';
    }

    if (this.whereFilter && this.whereFilter.length > 0) {
        var queryFiltersString = this._getWhereQueryFilter(this.whereFilter);

        if (typeof queryFiltersString === "undefined") {
            throw 'Invalid query filters selected with id: ' + JSON.stringify(this.whereFilter);
        }

        url += '$filter=' + queryFiltersString + '&';
    }

	if(this.selectPropertyList && this.selectPropertyList.length > 0 && 
		typeof this.selectedEntityId != 'undefined' && this.selectedEntityId != null) {
			url += '$select=';

		var selectOptions = [];

		for(var i in this.selectPropertyList) {
			var propertyId = this.selectPropertyList[i].propertyId;
			var value = this.selectPropertyList[i].value;
			var propertyName = this._getPropertyForEntity(this.selectedEntityId, propertyId).name;

			if(propertyName) {
				switch(value) {
					case 0:
						break;
					case 1:
						selectOptions.push(propertyName);
						break;
				}
			}
		}

		url += selectOptions.join() + '&';
	}

    if (this.orderByPropertyList && this.orderByPropertyList.length > 0 &&
        typeof this.selectedEntityId !== "undefined" && this.selectedEntityId != null) {
        url += '$orderby=';

        var sortingOptions = [];

        for (var i in this.orderByPropertyList) {
            var propertyId = this.orderByPropertyList[i].propertyId;
            var value = this.orderByPropertyList[i].value;
            var propertyName = this._getPropertyForEntity(this.selectedEntityId, propertyId).name;

            if (propertyName) {
                switch (value) {
                    case 0: {
                        // Do not order by this propertyId.
                        break;
                    }
                    case 1: {
                        // Sort in asc order.
                        sortingOptions.push(propertyName);
                        break;
                    }
                    case 2: {
                        // Sort in desc order.
                        sortingOptions.push(propertyName + ' desc');
                        break;
                    }
                }
            }
        }

        // Separate the elements with a comma ',' and add the '&' at the end.
        url += sortingOptions.join() + '&';
    }


    // Remove the & at the end.
    var lastUrlCharIndex = url.length - 1;
    if (url[lastUrlCharIndex] === '&') {
        url = url.substring(0, lastUrlCharIndex);
    }

    return url;
};

/// <summary>
/// Return the next filter id, used to know which of the filters we are adding/modifying/deleting.
/// </summary>
/// <returns type="String">The next where filter id.</returns>
OData.explorer.QueryBuilder.prototype.getNextWhereId = function () {
    return 'odataExplorerFilter' + this.whereFilterId++;
};

//Remove the specific where filter
OData.explorer.QueryBuilder.prototype.removeWhereFilter = function(specificId) {
	for(var i = this.whereFilter.length - 1; i >= 0; i--) {
		if(this.whereFilter[i].id == specificId) {
			this.whereFilter.splice(i, 1);
			break;
		}
	}
};

//Empty the where filter
OData.explorer.QueryBuilder.prototype.emptyWhereFilter = function() {
	this.whereFilter = [];	
};

//Add or update a new query filter
OData.explorer.QueryBuilder.prototype.addOrUpdateWhereFilter = function(specificId, propListNames, propListIds, propListReferringEntityIds, propFilterId, val) {
	var whereClause = {
		id: specificId,
		propertyListNames: propListNames,
		propertyListReferringEntityIds: propListReferringEntityIds,
		propertiesListIds: propListIds,
		propertyFilterId: propFilterId,
		value: val
	};

	for(var i = this.whereFilter.length - 1; i >= 0; i --) {
		if(this.whereFilter[i].id === specificId) {
			this.whereFilter[i] = whereClause;
			return;
		}
	}

	this.whereFilter.push(whereClause);
};

OData.explorer.QueryBuilder.prototype._getNamesValueFromEntities = function (theEntities, theInheritanceLevel, index) {
    theInheritanceLevel = theInheritanceLevel || 0;
    index = index || 0;

    var keys = [];
    var position = 0;

    // Default padding for hierarchy up to 4 levels. 
    // If the hierarchy is deeper, new levels will be created automatically.
    var padding = ['', '. . ', , '. . . . ', , '. . . . . . '];

    for (var i = index, l = theEntities.length; i < l; i++) {
        var level = this._getNumberOfLevelOfInheritance(theEntities[i]);
        var paddingLevel = this._getNumberOfLevelOfInheritance(theEntities[i], true);

        // Add new padding levels for very deep hierarchies.
        if (!padding[paddingLevel]) {
            padding[paddingLevel] = Array(paddingLevel + 1).join(padding[1]);
        }

        if (level < theInheritanceLevel) {
            // Base step.
            return keys;
        } else if (level == theInheritanceLevel) {
            var entry = {
                key: i,
                value: padding[paddingLevel] + theEntities[i].name,
                inheritanceLevel: level,
                entity: theEntities[i]
            };

            position = this._locationOf(entry, keys);

            keys.splice(position, 0, entry);
        } else if (level > theInheritanceLevel) {
            // Recursion step.
            var result = this._getNamesValueFromEntities(theEntities, level, i);
            var args = [position + 1, 0].concat(result);
            Array.prototype.splice.apply(keys, args);

            i += result.length - 1;
        }
    }
    return keys;
};

/// <summary>
/// Return the location of the element in the dictionary, by value comparison.
/// </summary>
/// <param name ="element" type="Object">The element.</param>
/// <param name ="dictionary" type="Array">The array to be searched.</param>
/// <returns type="String">The index in the dictionary.</returns>
OData.explorer.QueryBuilder.prototype._locationOf = function (element, dictionary) {
    for (var i = dictionary.length - 1; i >= 0; i--) {
        if (dictionary[i].inheritanceLevel == element.inheritanceLevel &&
            dictionary[i].value >= element.value) {
            return i;
        }
    }

    // Not found.
    return dictionary.length;
};

/// <summary>
/// Return the entity by its id.
/// </summary>
/// <param name ="entityId" type="Integer">The entity id.</param>
/// <returns type="Object">The entity.</returns>
OData.explorer.QueryBuilder.prototype._getEntityById = function (entityId) {
    return this.entities[entityId];
};

/// <summary>
/// Return the entity by its name.
/// </summary>
/// <param name ="entityName" type="String">The entity name.</param>
/// <returns type="Object">The entity.</returns>
OData.explorer.QueryBuilder.prototype._getEntityByName = function (entityName) {
    for (var i = this.entities.length - 1; i >= 0; i--) {
        if (this.entities[i].name == entityName) {
            return this.entities[i];
        }
    }

    return undefined;
};

/// <summary>
/// Return the entity id by its name.
/// </summary>
/// <param name ="entityName" type="String">The entity name.</param>
/// <returns type="Object">The entity.</returns>
OData.explorer.QueryBuilder.prototype._getEntityIdByName = function (entityName) {
    for (var i = this.entities.length - 1; i >= 0; i--) {
        if (this.entities[i].name == entityName) {
            return i;
        }
    }

    return undefined;
};

/// <summary>
/// Return the root base entity for the entity passed as an argument.
/// </summary>
/// <param name ="entity" type="Object">The entity.</param>
/// <returns type="Object">The entity.</returns>
OData.explorer.QueryBuilder.prototype._getRootParentEntity = function (entity) {
    var baseType = entity.baseType;

    // If it is a hierarchical entity.
    if (typeof baseType !== 'undefined' && baseType != null) {
        var baseEntityName = baseType.replace(this.namespace + '.', '');
        var baseEntity = this._getEntityByName(baseEntityName);

        return this._getRootParentEntity(baseEntity);
    }

    return entity;
};

/// <summary>
/// Return the number of levels of class inheritance in the hierarchy of the specified entity.
/// </summary>
/// <param name ="entity" type="Object">The entity.</param>
/// <param name ="skipAbstract" type="Boolean">If true it will not count abstract classes in the inheritance path.</param>
/// <returns type="Integer">The number of level of inheritance.</returns>
OData.explorer.QueryBuilder.prototype._getNumberOfLevelOfInheritance = function (entity, skipAbstract) {
    skipAbstract = skipAbstract || false;
    var baseType = entity.baseType;

    // If it is a hierarchical entity.
    if (typeof baseType !== 'undefined' && baseType != null) {
        var baseEntityName = baseType.replace(this.namespace + '.', '');
        var baseEntity = this._getEntityByName(baseEntityName);

        if (skipAbstract && baseEntity.abstract) {
            return this._getNumberOfLevelOfInheritance(baseEntity, skipAbstract);
        }

        return 1 + this._getNumberOfLevelOfInheritance(baseEntity);
    }

    return 0;
};

/// <summary>
/// Return the entity name that has to be used in the final OData query url.
/// Example:
/// Not hierarchical model:
/// sometimes the name gets pluralized ex: Category -> Categories or it stays the same Account -> Account
/// Hierarchical model:
/// The path would be something like: 
/// Service.svc/Item/Service.Server where ¡°Server¡± extends ¡°Device¡± which extends ¡°Item¡± 
/// but the URL takes the form of .../Service.svc/<root base class>/<namespace>.<derived class> and 
/// all the intermediate classes in the hierarchy are ¡°ignored¡± (with regards to the URL).
/// </summary>
/// <param name ="entityId" type="Integer">The entity id.</param>
/// <returns type="String">The entity name.</returns>
OData.explorer.QueryBuilder.prototype._getEntityQueryName = function (entityId) {
    var entity = this._getEntityById(entityId);

    // If it is a hierarchical entity.
    if (typeof entity.baseType !== 'undefined') {
        var parentEntity = this._getRootParentEntity(entity);

        if (!parentEntity.abstract) {
            return this._getEntitySetQueryNameFromEntityName(parentEntity.name) + '/' +
                this.namespace + '.' + entity.name;
        }
    }

    return this._getEntitySetQueryNameFromEntityName(entity.name);
};

/// <summary>
/// Return the entitySet query name from the entity name.
/// </summary>
/// <param name ="entityName" type="String">The entity name.</param>
/// <returns type="String">The entitySet query name from the entity name.</returns>
OData.explorer.QueryBuilder.prototype._getEntitySetQueryNameFromEntityName = function (entityName) {
    if (!entityName) {
        throw 'Missing required parameter "name".';
    }

    var namespacedName = this.namespace + '.' + entityName;

    for (var i = this.entitySet.length - 1; i >= 0; i--) {
        if (this.entitySet[i].entityType === namespacedName) {
            return this.entitySet[i].name;
        }
    }

    return undefined;
};

//Define the DataExplorer function the entry function
OData.explorer.DataExplorer = function(endpoints) {
	var endpointsType = typeof endpoints;
	if(!endpoints || (!endpoints.url && (!$.isArray(endpoints) || endpoints.length === 0))) {
		throw 'You must at least specify one endpoint';
	}

	this.defaultTop = OData.explorer.constants.defaultTop;
	this.defaultSkip = OData.explorer.constants.defaultSkip;
	this.endpoints = endpoints.url ? [endpoints] : endpoints;
	
	//Find the query builder container or create one
	this.$queryBuilderContainer = $('#queryBuilderContainer');
	if(this.$queryBuilderContainer.size() === 0) {
		this.$queryBuilderContainer = $('body').prepend('<div id="queryBuilderContainer" />');
	}

	//Create the control contents
	this.$queryBuilderContainer.empty();
	this.$queryBuilder = $('<div id="queryBuilder" />');
	this.$queryResult = $('<div id="queryResult" />');
	this.$queryBuilderContainer.append(this.$queryBuilder, this.$queryResult);
	var queryBuilderForm = $('<form autocomplete="off" id="queryBuilderForm" />');
	this.$queryBuilder.append($('<div id="queryBusy" />'));
	this.$busy = $('#queryBusy', this.$queryBuilder);
	this.$queryBuilder.append(queryBuilderForm);
	queryBuilderForm.append($([
		'<label for="endpoints">Endpoints:</label>',
		'<select id="endpoints"></select>',
		'<div id="queryFilters">',
			'<div><label for="entities">Entity:</label><select id="entities"></select></div>',
			'<div><label for="top">Top:</label><select id="top"></select></div>',
			'<div><label for="skip">Skip:</label><select id="skip"></select></div>',
			'<div id="filterConditions">',
				'<div id="selectConditions">',
					'<label id="select">Select:</label><button id="addSelectCondition">+</button>',
					'<span id="selectFiltersList"></span>',
				'</div>',
				'<div id="whereConditions">',
					'<label id="where">Where:</label><button id="addCondition">+</button>',
				'</div>',
				'<div id="orderByConditions">',
					'<label id="orderBy">OrderBy:</label><button id="addOrderByCondition">+</button>',
					'<span id="orderByFiltersList"></span>',
				'</div>',
				'<div id="formatConditions">',
					'<label class="radio inline"><input type="radio" value="json" name="group" checked="checked">JSON</label>',
					'<label class="radio inline"><input type="radio" value="xml" name="group">XML</label>',
				'</div>',
			'</div>',
			'<div><a id="queryUrl" href="/" target="_blank"></a></div>',
		'</div>'
	].join('')));	
	this.$whereConditions = $('#whereConditions', queryBuilderForm);
	this.$selectConditions = $('#selectConditions', queryBuilderForm);
	this.$selectFiltersList = $('#selectFiltersList', queryBuilderForm);
	this.$orderByConditions = $('#orderByConditions', queryBuilderForm);
	this.$orderByFiltersList = $('#orderByFiltersList', queryBuilderForm);
	this.$entities = $('#entities', queryBuilderForm);
	this.$filterConditions = $('#filterConditions', queryBuilderForm);
	this.$queryFilters = $('#queryFilters', queryBuilderForm);
	this.$addSelectCondition = $('#addSelectCondition', queryBuilderForm);
	this.$addCondition = $('#addCondition', queryBuilderForm);
	this.$addOrderByCondition = $('#addOrderByCondition', queryBuilderForm);
	this.$queryUrl = $('#queryUrl', queryBuilderForm);
	this.$top = $('#top', queryBuilderForm);
	this.$skip = $('#skip', queryBuilderForm);
	this.$formatRadio = $('input:radio', queryBuilderForm);
	this.addOptions([
		{key: 10, value: '10'},
		{key: 20, value: '20'},
		{key: 50, value: '50'},
		{key: 100, value: '100'},
		{key: 200, value: '200'}
	], this.$top);
	this.addOptions([
	{key: 10, value: '10'},
	{key: 20, value: '20'},
	{key: 30, value: '30'}
	], this.$skip);
	this.$endpoints = $('#endpoints', queryBuilderForm);
	var endpointsOption = [];
	var endpointsCount = endpoints.length;
	//Base on the input endpoints configuration to generate the endpoints option array
	for(var i = 0; i < endpointsCount; i++) {
		var endpoint = endpoints[i];
		endpointsOption.push({key: endpoint.url, value: endpoint.name || endpoint.url});
	}
	
	//Add option to the endpoint select
	this.addOptions(endpointsOption, this.$endpoints);
	
	this.$queryBuilder.append([
		'<div id="queryButtons">',
			'<button id="submitQuery">Search</button><button id="clearQuery">Reset</button>',
		'</div>',
		'<div id="errorMessage" />'
	].join(''));
	this.$queryButtons = $('#queryButtons', this.$queryBuilder);
	this.$submitQuery = $('#submitQuery', this.$queryBuilder);
	this.$clearQuery = $('#clearQuery', this.$queryBuilder);
	this.$errorMessage = $('#errorMessage', this.$queryBuilder);


	//Cache for the query builders
	this.queryBuilders = [];

	//Event handler for updating the metadata model
	this.$endpoints.change($.proxy(function(event) {
		var url = OData.explorer._cleanODataEndpointUrl($(event.target).val());
		this.$queryFilters.hide();
		this.$queryButtons.hide();
		this.$queryResult.empty();
		this.showErrorMessage('Generate query builder...', -1);

		if(this.queryBuilders[url]) {
			this.queryBuilder = this.queryBuilders[url];
			this.Reset();
		} else {
			var endpoint = this.endpoints[event.target.selectedIndex];

			if(endpoint.provider) {

			} else {
				this.queryBuilder = this.queryBuilders[url] =
					new OData.explorer.QueryBuilder(url);

				var promise = this.queryBuilder.initialize();

				promise.done($.proxy(this.Reset, this));

				//The query builder has not been successfully initialized
				promise.fail($.proxy(function(err) {
					this.queryBuilders[url] = null;
					this.Reset(error);
				}, this));
			}
		}
	}, this));

	//Now we have the event handler we can set the select option and trigger the event
	this.$endpoints.val(this.$endpoints.find('option:first').val());
	this.$endpoints.change();
	if(endpointsOption.length === 0) {
		this.$endpoints.attr('disable', true);
	}

	//Event handler for different controls event
	this.$entities.change($.proxy(function(event) {
		var $e = $(event.target);
		var entityIndex = $e.val();

		if(entityIndex >= 0) {
			this.$queryButtons.show();
		} else {
			this.$queryButtons.hide();
		}

		this.resetQuery(entityIndex);
	}, this));

	this.$addSelectCondition.click($.proxy(function(event) {
		event.preventDefault();

		if(this.$selectFiltersList.is(':visible')) {
			this.$selectFiltersList.children('input[type="checkbox"]').attr('checked', false);
			this.queryBuilder.clearSelectProperty();
			this.updateUrl(this.queryBuilder.getGeneratedODataQueryUrl());
		}

		this.$selectConditions.toggleClass('selectVisible');
	}, this));

	this.$skip.change($.proxy(function(event) {
		var itemId = $(event.target).val();
		this.queryBuilder.setSkip(itemId);
		this.updateUrl(this.queryBuilder.getGeneratedODataQueryUrl());
	}, this));

	this.$top.change($.proxy(function(event) {
		var itemId = $(event.target).val();
		this.queryBuilder.setTop(itemId);
		this.updateUrl(this.queryBuilder.getGeneratedODataQueryUrl());
	}, this));

	this.$formatRadio.change($.proxy(function(event) {
		var value = $(event.target).val();
		this.queryBuilder.setFormat(value);
		this.updateUrl(this.queryBuilder.getGeneratedODataQueryUrl());
	}, this));

	this.$submitQuery.click($.proxy(function() {
		var url = this.getUrl();
		if(url) {
			this.hideErrorMessage();
			this.queryData(url);
		}
	}, this));

	this.$clearQuery.click($.proxy(function() {
	}));

	this.$selectFiltersList.on('click', ':input', $.proxy(function(event) {
		var $e = $(event.target);
		var propertyId = $e.val();
		var isChecked = +$e.is(':checked');
		this.queryBuilder.setSelectProperty(propertyId, isChecked);
		this.updateUrl(this.queryBuilder.getGeneratedODataQueryUrl());
	}, this));

	this.$addCondition.click($.proxy(function(event) {
		event.preventDefault();

		this.createNewWhereQuery();
	}, this));

	this.$whereConditions.on('click', '.removeCondition', $.proxy(function(event) {
		var $e = $(event.target);
		var whereClauseId = $e.data('whereClauseId');
		$e.parent().remove();
		this.queryBuilder.removeWhereFilter(whereClauseId);
		this.updateUrl(this.queryBuilder.getGeneratedODataQueryUrl());
	}, this));

	this.$addOrderByCondition.click($.proxy(function(event) {
		event.preventDefault();

		if(this.$orderByFiltersList.is(':visible')) {
			this.$orderByFiltersList.children('input[type="checkbox"]').attr('checked', false);
			this.queryBuilder.clearOrderByProperty();
			this.updateUrl(this.queryBuilder.getGeneratedODataQueryUrl());
		}

		this.$orderByConditions.toggleClass('orderByVisible');
	}, this));

	this.$orderByFiltersList.on('click', ':input', $.proxy(function(event) {
		var $e = $(event.target);
		var propertyId = $e.val();
		var isChecked = +$e.is(':checked');
		this.queryBuilder.setOrderByProperty(propertyId, isChecked);
		this.updateUrl(this.queryBuilder.getGeneratedODataQueryUrl());
	}, this));

	// Event handler for when the filter property or navigation propety has changed.
    this.$queryBuilder.on('change', '.property, .navPropertyProperties', $.proxy(function (event) {
        var $e = $(event.target);
        var propertyId = $e.val();
        var $whereClause = $e.parent();
        var whereClauseId = $whereClause.attr('id');
        var navigationPropertiesNumber = 1 + $whereClause.children(".navPropertyProperties").length;

        // Remove all filters and input filters because the (navigation) property has changed.
        $e.nextAll().remove();
        this.queryBuilder.removeWhereFilter(whereClauseId);

        if (propertyId >= 0) {
            var entityReferringId = $e.data("referringentityid");
            var queryProperty = this.queryBuilder.getQueryPropertiesAndNavigationPropertiesFromQueryId(entityReferringId, propertyId);
            if (queryProperty.type == 'property') {
                var propertyOptions = this.queryBuilder.getFilterOptionsForProperty(entityReferringId, propertyId);

                // If the only filter of this property is an error message, then display it.
                if (propertyOptions.length == 1 && propertyOptions[0].errorMessage) {
                    $whereClause.append('<span>' + propertyOptions[0].errorMessage + '</span>');
                } else {    // If there are possible filters for this properties, display them.
                    var keys = [];
                    for (var i = 0, l = propertyOptions.length; i < l; i++) {
                        keys.push({ key: i, value: propertyOptions[i].displayName });
                    }

                    var displayThePropertyFilterInput = false;
                    for (var k = 0; k < propertyOptions.length; k++) {
                        if (propertyOptions[k].inputType != false ||
                            typeof propertyOptions[k].inputTypeOptions !== 'undefined') {

                            displayThePropertyFilterInput = true;
                            break;
                        }
                    }

                    this.addDropdown(
                        'propertyFilter',
                        keys,
                        $whereClause,
                        entityReferringId,
                        false,
                        displayThePropertyFilterInput);
                }
            } else {
                // Only allow navigation recursion to the maximum depth set in the query builder class.
                var refEntityId = this.queryBuilder.getNavigationPropertyReferringEntityId(entityReferringId, queryProperty.id);
                var navigationOptions;
                if (navigationPropertiesNumber >= this.queryBuilder.getMaxNavigationRecursion()) {
                    navigationOptions = this.queryBuilder.getQueryPropertiesAndNavigationPropertiesForEntity(refEntityId, true);
                } else {
                    navigationOptions = this.queryBuilder.getQueryPropertiesAndNavigationPropertiesForEntity(refEntityId);
                }

                // If the navigation property has nothing to display afterwards, then show a message.
                if (!navigationOptions || navigationOptions.length == 0) {
                    $whereClause.append('<span>No options to query for this navigation property</span>');
                } else {
                    this.addDropdown('navPropertyProperties', navigationOptions, $whereClause, refEntityId, false, false);
                }
            }
        }

        this.updateUrl(this.queryBuilder.getGeneratedODataQueryUrl());
    }, this));
	
	// Event handler for when the property filter has changed.
    this.$queryBuilder.on('change', '.propertyFilter', $.proxy(function (event) {
        var $e = $(event.target);
        // Update the propertyFilterInput or remove it if not needed.
        var parent = $e.parent();
        var whereClauseId = parent.attr('id');
        var selectedReferringEntityId = $e.data("referringentityid");
        var propertyFilterInput = parent.children('.propertyFilterInput');
        var propertyId = $e.prev().children("option:selected").val();
        var propertyFilterId = $e.children("option:selected").val();

        if (propertyFilterId >= 0) {
            var propOptions = this.queryBuilder.getFilterOptionsForProperty(selectedReferringEntityId, propertyId);

            var whereFilter = propOptions[propertyFilterId];
            var inputType = whereFilter.inputType;
            var inputTypeOptions = whereFilter.inputTypeOptions;

            if (inputType == false) {
                propertyFilterInput.remove();
                if (typeof inputTypeOptions !== 'undefined') {
                    var options = [];
                    for (var i in inputTypeOptions) {
                        options.push({ key: i, value: inputTypeOptions[i] });
                    }

                    this.addDropdown('propertyFilterInput', options, '#' + whereClauseId, selectedReferringEntityId, false, false);
                }
            } else {
                // Check if we need to remove the dropdown to add an input field.
                if (propertyFilterInput.is('select')) {
                    propertyFilterInput.remove();
                    this.addInput('propertyFilterInput', '#' + whereClauseId);
                    propertyFilterInput = parent.children('.propertyFilterInput');
                }

                propertyFilterInput.data("inputType", inputType);
            }
        }

    }, this));

    // Event handler for allowing only specific values in the input fields.
    this.$queryBuilder.on('keypress paste keyup', '.propertyFilterInput', function (event) {
        var $e = $(event.target);
        var inputType = $e.data("inputType");

        switch (inputType) {
            case 'int':
                return OData.explorer.validation.allowOnlyInts(event);
            case 'double':
                return OData.explorer.validation.allowOnlyDoubles(event);
            case 'guid':
                return OData.explorer.validation.allowOnlyGuids(event);
        }

        return true;
    });

    // Event handler for when the filter property or input has changed.
    this.$queryBuilder.on('change keyup', '.propertyFilterInput, .propertyFilter', $.proxy(function (event) {
        var $e = $(event.target);
        var parent = $e.parent();
        var id = parent.attr('id');
        var $property = parent.children('.property');
        var propertyListNames = [$property.children("option:selected").text()];
        var propertyListIds = [$property.val()];
        var propertyListReferringEntityIds = [$property.data("referringentityid")];

        parent.children('.navPropertyProperties').each(function () {
            var $thisElement = $(this);
            var selectedPropName = $thisElement.children("option:selected").text();
            propertyListNames.push(selectedPropName);
            propertyListIds.push($thisElement.val());

            var selectedReferringEntityId = $thisElement.data("referringentityid");
            propertyListReferringEntityIds.push(selectedReferringEntityId);
        });
        var propFilterId = parent.children('.propertyFilter').children("option:selected").val();
        var itemText = parent.children('.propertyFilterInput').val();

        this.queryBuilder.addOrUpdateWhereFilter(id, propertyListNames, propertyListIds, propertyListReferringEntityIds, propFilterId, itemText);
        this.updateUrl(this.queryBuilder.getGeneratedODataQueryUrl());
    }, this));
};

OData.explorer.DataExplorer.prototype.Reset = function(error) {
	this.resetQuery();
	this.hideErrorMessage();

	if(error) {
		this.showErrorMessage(JSON.stringify(error), -1);
	} else {
		//Set up
		this.$queryFilters.show();
		this.$entities.children('option').remove();
		this.addOptions(this.queryBuilder.getEntitiesNames(), this.$entities, true);
		this.$top.val(this.defaultTop);
		this.resetQuery();
	}
};

OData.explorer.DataExplorer.prototype.resetQuery = function(entityIndex) {
	//First reset the original query builder form
	this.hideErrorMessage();
	this.$queryUrl.hide();
	this.updateUrl();
	this.$whereConditions.children('div').remove();
	this.$filterConditions.hide();
	this.$orderByConditions.removeClass('orderByVisible');
	this.$orderByFiltersList.empty();
	this.$selectConditions.removeClass('selectVisible');
	this.$selectFiltersList.empty();
	this.$queryResult.empty();

	if(this.queryBuilder) {
		this.queryBuilder.emptyWhereFilters();
		this.queryBuilder.clearOrderByProperty();
		this.queryBuilder.clearSelectProperty();
		this.queryBuilder.setTop(this.$top.val());
		this.queryBuilder.setSkip(this.$skip.val());

		entityIndex = entityIndex || this.$entities.val();
		if(entityIndex && entityIndex >= 0) {
			this.queryBuilder.setSelectedEntityId(entityIndex);
			this.updateUrl(this.queryBuilder.getGeneratedODataQueryUrl());
			this.$queryUrl.show();

			//set up the more filter options
			var properties = this.queryBuilder.getQueryPropertiesAndNavigationPropertiesForEntity(
					this.queryBuilder.getSelectedEntityId(), true);
			
			for(var i in properties) {
				var property = properties[i];
				var htmlId = 'orderby_' + property.key;
				var selectId = 'select_' + property.key;
				var $orderByLabel = $('<label />', {'for': htmlId, text: property.value });
				$orderByLabel.appendTo(this.$orderByFiltersList);
				$('<input />', {type: 'checkbox', id: htmlId, value: property.key}).appendTo($orderByLabel);
				var $selectLabel = $('<label />', {'for': selectId, text: property.value});
				$selectLabel.appendTo(this.$selectFiltersList);
				$('<input />', {type: 'checkbox', id: selectId, value: property.key}).appendTo($selectLabel);
			}

			this.$filterConditions.show();
		}
	} else {
		this.updateUrl();
	}
};

//Define prototype method for DataExplorer
//Add option for every select control
OData.explorer.DataExplorer.prototype.addOptions = function(options, select, addEmptySelect) {
	if(addEmptySelect) {
		$('<option />', {value: -1, text: '-- Select --'}).appendTo(select);
	}

	$.each(options, function(index, e) {
		var option = $('<option />', {value: e.key, text: e.value}); 

		if(typeof e.type !== 'undefined' && e.type == 'navigationProperty') {
			option.addClass('navigationDropdown');
		}

		option.appendTo(select);
	});
};

//Show the error message
OData.explorer.DataExplorer.prototype.showErrorMessage = function(msg, delay) {
	delay = delay || OData.explorer.constants.defaultErrorMessageDuration;

	if(delay < 0) {
		this.$errorMessage.text(msg).addClass('error').show();
	} else {
		this.$errorMessage.text(msg).addClass('error').show().delay(delay).fadeOut('fast');
	}
};

//Hide the error message
OData.explorer.DataExplorer.prototype.hideErrorMessage = function() {
	this.$errorMessage.hide();	
};

//Upate the query url control
OData.explorer.DataExplorer.prototype.updateUrl = function(url) {
	url = url || '';
	this.$queryUrl.text(url).attr('href', url);
};

//Get the query url control value
OData.explorer.DataExplorer.prototype.getUrl = function() {
	return this.$queryUrl.attr('href');
};

//Create a new where query input
OData.explorer.DataExplorer.prototype.createNewWhereQuery = function() {
	var whereClauseId = this.queryBuilder.getNextWhereId();
	var $whereClause = $('<div />', {id: whereClauseId})
		.insertBefore(this.$addCondition);

	$whereClause.append($(
        '<button />', { 'class': 'removeCondition', 'data-whereclauseid': whereClauseId, text: 'X' }));
    var selectedEntityId = this.queryBuilder.getSelectedEntityId();
    this.addDropdown(
        'property',
        this.queryBuilder.getQueryPropertiesAndNavigationPropertiesForEntity(selectedEntityId),
        $whereClause,
        this.queryBuilder.getSelectedEntityId(),
        false,
        false);
	
};

/// <summary>Adds a drop down select control.</summary>
/// <param name="classId">The CSS class name for the select that will be created.</param>
/// <param name="options">The array of options data for the select.</param>
/// <param name="appendTo">The element, or selector for the element, to append the select to.</param>
/// <param name="referringEntityId">The id of the entity the select refers to.</param>
/// <param name="addEmptySelect">Flag indicating if an empty first option should be added.</param>
/// <param name="addPropertyFilterInput">Flag indicating if the property filter input should be added.</param>
OData.explorer.DataExplorer.prototype.addDropdown = function (
    classId, options, appendTo, referringEntityId, addEmptySelect, addPropertyFilterInput) {
    var select = $('<select class="' + classId +
        '" data-referringentityid=' + referringEntityId + '/>');

    this.addOptions(options, select, addEmptySelect);
    select.appendTo(appendTo);

    if (addPropertyFilterInput) {
        this.addInput('propertyFilterInput', appendTo);
    }

    // Trigger change so that the code knows that it has been added.
    select.trigger('change');
};

/// <summary>Adds an text input control.</summary>
/// <param name="classId">The CSS class name for the input that will be created.</param>
/// <param name="appendTo">The element, or selector for the element, to append the input to.</param>
OData.explorer.DataExplorer.prototype.addInput = function (classId, appendTo) {
    var s = $('<input type="text" class="' + classId + '"/>');
    s.appendTo(appendTo);
};

OData.explorer.DataExplorer.prototype.busy = function(isBusy) {
	if(isBusy) {
		this.$busy.show();
	} else {
		this.$busy.hide();
	}
};

/// <summary>
/// Queries data from the specified URL and passes the results to the results callback handler method.
/// </summary>
/// <param name ="url">The URL to query data from.</param>
/// <param name ="callback">A callback to call with the data, the calling context will be "this".</param>
/// <param name ="context">An additional context, besides "this", to pass to the callback.</param>
OData.explorer.DataExplorer.prototype.queryData = function (url, callback, context) {
    callback = callback || this.resultsCallback;
    var me = this;
    this.busy(true);

    // First try without jsonp.
    OData.read(
        { requestUri: url, enableJsonpCallback: false, timeoutMS: OData.explorer.constants.queryTimeout },
       // Success callback.
       function (data, request) {
           callback.call(me, data, context);
       },
       // Error callback.
       $.proxy(function () {
            // If it fails try with jsonp.
            // Set the formatQueryString so that it returns application/json;odata=fullmetadata
            OData.defaultHttpClient.formatQueryString = '$format=application/json;odata=fullmetadata;';

            OData.read(
            { requestUri: url, enableJsonpCallback: true, timeoutMS: OData.explorer.constants.queryTimeout },
            // Success callback.
            function (data, request) {
                callback.call(me, data, context);
            },
            // Error callback.
            $.proxy(function (error) {
                this.showErrorMessage(JSON.stringify(error));
                this.busy(false);
            }, this));
       }, this));
};

OData.explorer.DataExplorer.prototype.resultsCallback = function(data) {
	this.$queryResult.empty();
	if(data) {
		alert('get data');
	}

	this.busy(false);
};
