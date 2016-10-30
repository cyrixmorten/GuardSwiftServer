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

    var Client = request.object;

    var positionUpdated = Client.get('positionUpdated');

    var isNewPosition = positionUpdated ? Math.abs(moment(positionUpdated).diff(moment(), 'seconds')) < 10 : false;
    if (isNewPosition) {
        console.log('New position!!!');
    }
    
});

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