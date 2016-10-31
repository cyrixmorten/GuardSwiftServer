var GeoCode = require('../utils/geocode.js');
var _ = require('lodash');
var moment = require('moment');

/*
 * Sanity check and obtain a GPS position for Client
 */
Parse.Cloud.beforeSave("Client", function (request, response) {
    
    var Client = request.object;

    var dirtyKeys = Client.dirtyKeys();
    var lookupAddress = false;
    var addressKeys = ["cityName", "zipcode", "addressName", "addressNumber"];
    for (var dirtyKey in dirtyKeys) {
        var dirtyValue = dirtyKeys[dirtyKey];
        if (_.includes(addressKeys, dirtyValue)) {
            lookupAddress = true;
        }
    }

    if (lookupAddress) {
        console.log("do addAddressToClient");
        addAddressToClient(Client, response);
    } else {
        console.log("no address lookup");
        response.success();
    }

});

Parse.Cloud.afterSave("Client", function (request) {

    // sendToCircuitUnits(request.object);

});

var sendToCircuitUnits = function(client) {
    var query = new Parse.Query('CircuitUnit');
    query.equalTo('client', client);
    query.find({useMasterKey: true}).then(function(circuitUnits) {
        console.log('Updating circuitUnits: ' + circuitUnits.length);

        _.forEach(circuitUnits, function(circuitUnit) {
            circuitUnit.set('clientId', client.get('clientId'));
            circuitUnit.set('clientName', client.get('name'));
            circuitUnit.set('clientPosition', client.get('position'));
            circuitUnit.save({useMasterKey: true});
        });

    }).fail(function(error) {
        console.error('error: ', error);
    })
};

var addAddressToClient = function (Client, response) {

    var addressName = Client.get("addressName");
    var addressNumber = Client.get("addressNumber");
    var zipcode = Client.get("zipcode");
    var cityName = Client.get("cityName");

    Client.set('fullAddress', addressName + " " + addressNumber);

    var searchAddress = addressName + " " + addressNumber + "," + zipcode + " "
        + cityName;

    if (addressName.length == 0) {
        response.error("Address must not be empty");
    } else if (zipcode == 0) {
        if (cityName.length == 0) {
            response.error("Zipcode and city name must not be empty");
        }
    } else {
        GeoCode.lookupAddress(searchAddress).then(function (point) {

            Client.set("position", point);

            console.log('setting new position:');
            console.log(point);

            Client.set('positionUpdated', new Date());
            response.success();
        }, function (error) {
            response.error("Address not found: " + searchAddress);
        });
    }
};