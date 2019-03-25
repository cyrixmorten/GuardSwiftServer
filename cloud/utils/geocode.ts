import * as _ from 'lodash';

/**
 * Returns {lat: latitude, lng: longitude} object
 *
 * @param searchAddress
 */
export let lookupAddress = async (searchAddress) => {
    const httpResponse = await Parse.Cloud.httpRequest({
        url: 'https://maps.googleapis.com/maps/api/geocode/json',
        params: {
            address: searchAddress,
            key: process.env.GOOGLE_GEOCODE_API_KEY
        },
    });

    let data = httpResponse.data;
    if (data.status == "OK") {

        let latlng = data.results[0].geometry.location;

        let lat = latlng.lat;
        let lng = latlng.lng;

        return new Parse.GeoPoint({
            latitude: lat,
            longitude: lng
        });
    }

    throw "Failed to locate coordinate for : " + searchAddress;
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
export let lookupPlaceObject = async (searchAddress, retryCount?) => {

    try {
        const httpResponse = await Parse.Cloud.httpRequest({
            url: 'https://maps.googleapis.com/maps/api/geocode/json',
            params: {
                address: searchAddress,
                key: process.env.GOOGLE_GEOCODE_API_KEY
            },
        });

        let data = httpResponse.data;
        if (data.status == "OK") {

            let placeObject = unwrapPlaceObject(data.results[0]);

            console.log('Found placeObject for: ' + searchAddress);

            return placeObject;

        }

    } catch (e) {
        if (retryCount) {
            throw "Failed to locate GPS coordinates for : " + searchAddress;
        }

        let searchWords: string[] = _.words(searchAddress);

        let zipCodes: string[] = _.filter(searchWords, function (word) {
            return word.length === 4;
        });

        let others = _.without(searchWords, ...zipCodes);

        console.log('searchWords: ', searchWords);
        console.log('zipcodes: ', zipCodes);
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

        let zipCode = _.last(zipCodes);
        if (zipCode) {
            newAddress += zipCode;
        }

        console.log('Retrying with: ' + newAddress);

        return exports.lookupPlaceObject(newAddress, 1);
    }

};

let unwrapPlaceObject =  (placeObject) => {

    let addressComponentByType = function (components: any[], type) {
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

    let object: any = {};
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