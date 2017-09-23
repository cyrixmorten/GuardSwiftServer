"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
/**
 * Returns {lat: latitude, lng: longitude} object
 *
 * @param searchAddress
 * @returns {Parse.Promise}
 */
exports.lookupAddress = function (searchAddress) {
    let promise = new Parse.Promise();
    Parse.Cloud.httpRequest({
        url: 'https://maps.googleapis.com/maps/api/geocode/json',
        params: {
            address: searchAddress,
            key: process.env.GOOGLE_GEOCODE_API_KEY
        },
        success: function (httpResponse) {
            let data = httpResponse.data;
            if (data.status == "OK") {
                let latlng = data.results[0].geometry.location;
                let lat = latlng.lat;
                let lng = latlng.lng;
                let point = new Parse.GeoPoint({
                    latitude: lat,
                    longitude: lng
                });
                promise.resolve(point);
            }
            else {
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
 * @param retryCount
 * @returns {Parse.Promise}
 */
exports.lookupPlaceObject = function (searchAddress, retryCount) {
    let promise = new Parse.Promise();
    Parse.Cloud.httpRequest({
        url: 'https://maps.googleapis.com/maps/api/geocode/json',
        params: {
            address: searchAddress,
            key: process.env.GOOGLE_GEOCODE_API_KEY
        },
        success: function (httpResponse) {
            let data = httpResponse.data;
            if (data.status == "OK") {
                let placeObject = unwrapPlaceObject(data.results[0]);
                console.log('Found placeObject for: ' + searchAddress);
                promise.resolve(placeObject);
            }
            else {
                let errorMsg = "Failed to locate coordinate for : " + searchAddress;
                console.error(errorMsg);
                promise.reject(errorMsg);
            }
        },
        error: function (httpResponse) {
            promise.reject(httpResponse);
        }
    });
    return promise.fail(function () {
        if (retryCount) {
            return Parse.Promise.error("Failed to look up address despite retrying");
        }
        let searchWords = _.words(searchAddress);
        let zipcodes = _.filter(searchWords, function (word) {
            return word.length === 4;
        });
        let others = _.without(searchWords, ...zipcodes);
        console.log('searchWords: ', searchWords);
        console.log('zipcodes: ', zipcodes);
        console.log('others: ', others);
        let newAddress = '';
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
        let zipcode = _.last(zipcodes);
        if (zipcode) {
            newAddress += zipcode;
        }
        console.log('Retrying with: ' + newAddress);
        return exports.lookupPlaceObject(newAddress, 1);
    });
};
let unwrapPlaceObject = function (placeObject) {
    let addressComponentByType = function (components, type) {
        if (_.isEmpty(components)) {
            return '';
        }
        let component = _.find(components, function (component) {
            return _.includes(component.types, type);
        });
        if (component) {
            return component.long_name;
        }
        return '';
    };
    let object = {};
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
    }
    else {
        object.position = new Parse.GeoPoint({
            latitude: 1,
            longitude: 1
        });
    }
    return object;
};
//# sourceMappingURL=geocode.js.map