import * as _ from 'lodash';

/**
 * Returns {lat: latitude, lng: longitude} object
 *
 * @param searchAddress
 * @returns {Parse.Promise}
 */
export let lookupAddress = function (searchAddress) {
    var promise = new Parse.Promise();
    Parse.Cloud.httpRequest({
        url: 'https://maps.googleapis.com/maps/api/geocode/json',
        params: {
            address: searchAddress,
            key: process.env.GOOGLE_GEOCODE_API_KEY
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
export let lookupPlaceObject = function (searchAddress, retryCount) {

    var promise = new Parse.Promise();
    Parse.Cloud.httpRequest({
        url: 'https://maps.googleapis.com/maps/api/geocode/json',
        params: {
            address: searchAddress,
            key: process.env.GOOGLE_GEOCODE_API_KEY
        },
        success: function (httpResponse) {
            var data = httpResponse.data;
            if (data.status == "OK") {

                var placeObject = unwrapPlaceObject(data.results[0]);

                console.log('Found placeObject for: ' + searchAddress);

                promise.resolve(placeObject);

            } else {
                var errorMsg = "Failed to locate coordinate for : "  + searchAddress;
                console.error(errorMsg);

                promise.reject(errorMsg);
            }
        },
        error: function (httpResponse) {
            promise.reject(httpResponse);
        }
    });

    return promise.fail(function() {
        if (retryCount) {
            return Parse.Promise.error("Failed to look up address despite retrying");
        }

        var searchWords = _.words(searchAddress);

        var zipcodes = _.filter(searchWords, function(word) {
            return word.length === 4;
        });

        var others = _.without(searchWords, zipcodes);

        console.log('searchWords: ', searchWords);
        console.log('zipcodes: ', zipcodes);
        console.log('others: ', others);

        var newAddress = '';
        if (!_.isEmpty(others)) {
            if (others.length >= 1) {
                newAddress += others[0];
                newAddress += " ";
            }
            if (others.length >= 2) {
                newAddress += others[1];
                newAddress += " ";
            }
        }

        var zipcode = _.last(zipcodes);
        if (zipcode) {
            newAddress += zipcode;
        }

        console.log('Retrying with: ' + newAddress);

        return exports.lookupPlaceObject(newAddress, 1);
    });
};

var unwrapPlaceObject = function (placeObject) {

    var addressComponentByType = function (components, type) {
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

    var object: any = {};
    object.placeObject = placeObject;
    object.placeId = placeObject.place_id;
    object.formattedAddress = placeObject.formatted_address;
    object.street = addressComponentByType(placeObject.address_components, 'route');
    object.streetNumber = addressComponentByType(placeObject.address_components, 'street_number');
    object.city = addressComponentByType(placeObject.address_components, 'locality');
    object.postalCode = addressComponentByType(placeObject.address_components, 'postal_code');
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