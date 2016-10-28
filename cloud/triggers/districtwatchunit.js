var GeoCode = require('../utils/geocode.js');

/*
 * Sanity check and obtain a GPS position for first addressNumber
 */
Parse.Cloud.beforeSave(
    "DistrictWatchUnit",
    function (request, response) {

        var unit = request.object;

        var addressName = unit.get("address");
        var addressNumbers = unit.get("addressNumbers");

        if (addressName.length == 0) {
            response.error("Address must not be empty");
        }

        if (addressNumbers.length == 0) {
            response.error("Streetnumbers must not be empty");
        }

        var DistrictWatch = unit.get('districtWatch');

        DistrictWatch.fetch().then(
            function (districtWatch) {

                var zipcode = districtWatch.get("zipcode");
                var cityName = districtWatch.get("city");

                var searchAddress = addressName + " "
                    + addressNumbers[0] + ","
                    + zipcode + " " + cityName;

                if (zipcode == 0) {
                    if (cityName.length == 0) {
                        response.error("Zipcode and city name must not be empty");
                    }
                } else {
                    GeoCode.lookupAddress(searchAddress).then(
                        function (point) {
                            unit.set(
                                "position",
                                point);
                            if (unit.isNew()) {
                                response.success();
                            } else {
                                var DistrictWatchClient = Parse.Object.extend("DistrictWatchClient");
                                var cleanUpQuery = new Parse.Query(
                                    DistrictWatchClient);
                                cleanUpQuery.equalTo(
                                    'districtWatchUnit',
                                    unit);
                                cleanUpQuery.each(
                                    function (object) {
                                        // remove
                                        // all
                                        // earlier
                                        // associated
                                        // DistrictWatchClient's
                                        return object.destroy();
                                    }).then(
                                    function () {
                                        response.success();
                                    },
                                    function (error) {
                                        console.error(error.message);
                                        response.error(error.message);
                                    });
                            }
                        },
                        function (error) {
                            response.error("Address not found: "
                                + searchAddress);
                        });
                }
            }, function (error) {
                console.error(error.message);
                console.error(DistrictWatch);
                unit.set("invalidPointer", true);
                response.success();
            });

    });

/*
 * Get positions for all addressNumbers and place in DistrictWatchGeoPoint
 */
Parse.Cloud.afterSave("DistrictWatchUnit", function (request) {
    Parse.Cloud.useMasterKey();

    var districtWatchUnit = request.object;
    var user = districtWatchUnit.get('owner');


    var districtWatch = districtWatchUnit.get("districtWatch");

    var addressName = districtWatchUnit.get("address");
    var addressNumbers = districtWatchUnit.get("addressNumbers");

    // look up addresses
    var Client = districtWatchUnit.get('client');

    Client.fetch().then(
        function (client) {

//				var zipcode = districtWatch.get("zipcode");
//				var cityName = districtWatch.get("city");

            var promises = [];
            addressNumbers.forEach(function (addressNumber) {
                var address = addressName + " " + addressNumber;
                // var searchAddress = address + ", "
                // + zipcode + " " + cityName;

                // console.log("Pushing " + searchAddress);
                var promise = createDistrictWatchClient(addressName,
                    addressNumber, client, districtWatch,
                    districtWatchUnit, user);
                promises.push(promise);
            });
            // Return a new promise that is resolved when all of the deletes
            // are finished.
            return Parse.Promise.when(promises);

        }).then(function () {
        // look up of every address complete
        // pushPinUpdate(Pins.DISTRICTWATCHS_CLIENTS, request);
    }, function (error) {
        console.error(error);
    });

});

var createDistrictWatchClient = function (addressName, addressNumber, client, districtWatch, districtWatchUnit, user) {

    var ACL = new Parse.ACL(user);

    var DistrictWatchClient = Parse.Object.extend("DistrictWatchClient");
    var districtWatchClient = new DistrictWatchClient();
    districtWatchClient.set('arrived', false);
    districtWatchClient.set('timesArrived', 0);
    districtWatchClient.set('client', client);
    districtWatchClient.set('districtWatch', districtWatch);
    districtWatchClient.set('districtWatchUnit', districtWatchUnit);
    districtWatchClient.set('districtWatchType', districtWatchUnit.get('type'));
    districtWatchClient.set('addressName', addressName);
    districtWatchClient.set('addressNumber', addressNumber);
    districtWatchClient.set('zipcode', client.get("zipcode"));
    districtWatchClient.set('cityName', client.get("cityName"));
    districtWatchClient.set("ACL", ACL);
    districtWatchClient.set('owner', user);

    return districtWatchClient.save();

};