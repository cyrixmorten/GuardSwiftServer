var GeoCode = require('../utils/geocode.js');

Parse.Cloud.beforeSave(
    "DistrictWatchClient",
    function (request, response) {

        var DistrictWatchClient = request.object;

        var DistrictWatchUnit = DistrictWatchClient.get('districtWatchUnit');

        DistrictWatchUnit.fetch().then(
            function (districtWatchUnit) {

                DistrictWatchClient.set('supervisions', districtWatchUnit.get('supervisions'));
                DistrictWatchClient.set('days', districtWatchUnit.get('days'));

                if (!DistrictWatchClient.has('completed'))
                    DistrictWatchClient.set('completed', false);


                var addressName = DistrictWatchClient.get("addressName");
                var addressNumber = DistrictWatchClient.get("addressNumber");
                var zipcode = DistrictWatchClient.get("zipcode");
                var cityName = DistrictWatchClient.get("cityName");

                DistrictWatchClient.set(
                    'fullAddress',
                    addressName
                    + " "
                    + addressNumber);

                var searchAddress = addressName
                    + " "
                    + addressNumber
                    + ","
                    + zipcode
                    + " "
                    + cityName;

                if (addressName.length == 0) {
                    response.error("Address must not be empty");
                } else if (zipcode == 0) {
                    if (cityName.length == 0) {
                        response.error("Zipcode and city name must not be empty");
                    }
                } else {
                    GeoCode.lookupAddress(
                        searchAddress).then(
                        function (point) {

                            DistrictWatchClient.set(
                                "position",
                                point);

                            response.success();
                        },
                        function (error) {
                            response.error("Address not found: "
                                + searchAddress);
                        });
                }
            }, function (error) {
                console.error('missing districtWatchUnit');
                DistrictWatchClient.destroy();
                response.success();
            });

    });