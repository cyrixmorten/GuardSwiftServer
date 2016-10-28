var GeoCode = require('../utils/geocode.js');
var _ = require('underscore');


/*
 * Sanity check and obtain a GPS position for Client
 */
Parse.Cloud.beforeSave("Client", function (request, response) {
    Parse.Cloud.useMasterKey();

    var Client = request.object;

    var dirtyKeys = Client.dirtyKeys();
    var lookupAddress = false;
    var addressKeys = ["cityName", "zipcode", "addressName", "addressNumber"];
    for (var dirtyKey in dirtyKeys) {
        var dirtyValue = dirtyKeys[dirtyKey];
        if (_.contains(addressKeys, dirtyValue)) {
            lookupAddress = true;
            console.log(dirtyValue + ": " + lookupAddress);
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

            response.success();
        }, function (error) {
            response.error("Address not found: " + searchAddress);
        });
    }
};