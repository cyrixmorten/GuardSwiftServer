var _ = require('lodash');
var Global = require('../global.js');

/**
 * Returns {lat: latitude, lng: longitude} object
 *
 * @param searchAddress
 * @returns {Parse.Promise}
 */
exports.lookupAddress = function (searchAddress) {
    var promise = new Parse.Promise();
    Parse.Cloud.httpRequest({
        url: 'https://maps.googleapis.com/maps/api/geocode/json',
        params: {
            address: searchAddress,
            key: Global.GOOGLE_GEOCODE_API_KEY
        },
        success: function (httpResponse) {
            var data = httpResponse.data;
            if (data.status == "OK") {

                var latlng = data.results[0].geometry.location;

                var lat = latlng.lat;
                var lng = latlng.lng;

                var point = new Parse.GeoPoint({
                    latitude: lat,
                    longitude: lng
                });

                promise.resolve(point);

            } else {
                console.error(httpResponse);
                promise.reject("Failed to locate coordinate for : "
                    + searchAddress);
            }
        },
        error: function (httpResponse) {
            promise.reject(httpResponse);
            console.error(httpResponse);
        }
    });
    return promise;
};


/**
 * {
 *   placeId: '',
 *   formattedAddress: '',
 *   street: '',
 *   streetNumber: '',
 *   city: '',
 *   postalCode: '',
 *   position: {
 *     latitude: lat,
 *     longitude: lng
 *   }
 * }
 * @param searchAddress
 * @returns {Parse.Promise}
 */
exports.lookupPlaceObject = function (searchAddress) {
    console.log('lookupPlaceObject');

    var promise = new Parse.Promise();
    Parse.Cloud.httpRequest({
        url: 'https://maps.googleapis.com/maps/api/geocode/json',
        params: {
            address: searchAddress,
            key: Global.GOOGLE_GEOCODE_API_KEY
        },
        success: function (httpResponse) {
            var data = httpResponse.data;
            if (data.status == "OK") {

                var placeObject = unwrapPlaceObject(data.results[0]);


                promise.resolve(placeObject);

            } else {
                console.error(httpResponse);
                promise.reject("Failed to locate coordinate for : "
                    + searchAddress);
            }
        },
        error: function (httpResponse) {
            promise.reject(httpResponse);
            console.error(httpResponse);
        }
    });
    return promise;
};

var unwrapPlaceObject = function (placeObject) {

    var adressComponentByType = function (components, type) {
        if (_.isEmpty(components)) {
            return '';
        }

        var component = _.find(components, function (component) {
            return _.includes(component.types, type);
        });

        if (component) {
            return component.long_name;
        }

        return '';
    };

    var object = {};
    object.placeId = placeObject.place_id;
    object.formattedAddress = placeObject.formatted_address;
    object.street = adressComponentByType(placeObject.address_components, 'route');
    object.streetNumber = adressComponentByType(placeObject.address_components, 'street_number');
    object.city = adressComponentByType(placeObject.address_components, 'locality');
    object.postalCode = adressComponentByType(placeObject.address_components, 'postal_code');
    if (placeObject.geometry) {
        object.position = new Parse.GeoPoint({
            latitude: placeObject.geometry.location.lat,
            longitude: placeObject.geometry.location.lng
        });
    } else {
        object.position = new Parse.GeoPoint({
            latitude: 1,
            longitude: 1
        })
    }

    return object;
};