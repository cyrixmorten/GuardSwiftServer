"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const geocode_1 = require("../utils/geocode");
class AlarmUtils {
}
AlarmUtils.findAlarm = function (options) {
    console.log('options: ', options);
    let Alarm = Parse.Object.extend('Task');
    let query = new Parse.Query(Alarm);
    query.equalTo('central', options.central);
    query.equalTo('owner', options.user);
    query.equalTo('fullAddress', options.parsed.alarmObject.fullAddress);
    return query.first({ useMasterKey: true });
};
AlarmUtils.findCentral = function (sender) {
    console.log('findCentral');
    let Central = Parse.Object.extend('Central');
    let query = new Parse.Query(Central);
    query.equalTo('sendFrom', sender);
    return query.first({ useMasterKey: true });
};
AlarmUtils.findUser = function (receiver) {
    console.log('findUser');
    let query = new Parse.Query(Parse.User);
    query.equalTo('sendTo', receiver);
    return query.first({ useMasterKey: true });
};
AlarmUtils.findClient = function (user, queryMap) {
    console.log('findClient', user, queryMap);
    let Client = Parse.Object.extend("Client");
    let query = new Parse.Query(Client);
    query.equalTo('owner', user);
    _.forOwn(queryMap, function (value, key) {
        if (!_.isUndefined(value)) {
            query.equalTo(key, value);
        }
    });
    return query.first({ useMasterKey: true });
};
AlarmUtils.createClient = function (user, alarm) {
    console.log('createClient');
    let id = alarm.get('clientId');
    let name = alarm.get('clientName');
    let fullAddress = alarm.get('fullAddress');
    return geocode_1.lookupPlaceObject(fullAddress).then(function (placeObject) {
        return Parse.Promise.as(placeObject);
    }, function () {
        // unable to look up address
        console.log('Failed to look up address for: ' + fullAddress);
        let fakePlaceObject = {
            placeObject: {},
            placeId: '',
            formattedAddress: fullAddress,
            street: '',
            streetNumber: '',
            city: '',
            postalCode: '',
            position: new Parse.GeoPoint({
                latitude: 1,
                longitude: 1
            })
        };
        return Parse.Promise.as(fakePlaceObject);
    }).then(function (placeObject) {
        let Client = Parse.Object.extend("Client");
        let client = new Client();
        client.set('clientId', id);
        client.set('automatic', true);
        client.set('name', name);
        client.set('fullAddress', fullAddress);
        client.set('owner', user);
        let acl = new Parse.ACL(user);
        client.setACL(acl);
        _.forOwn(placeObject, function (value, key) {
            client.set(key, value);
        });
        return client.save(null, { useMasterKey: true });
    });
};
exports.AlarmUtils = AlarmUtils;
//# sourceMappingURL=utils.js.map