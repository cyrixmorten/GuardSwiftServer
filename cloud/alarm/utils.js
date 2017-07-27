var _ = require('lodash');
var geocode = require('../utils/geocode.js');

exports.findAlarm = function (options) {
    console.log('options: ', options);

    var Alarm = Parse.Object.extend('Task');
    var query = new Parse.Query(Alarm);
    query.equalTo('central', options.central);
    query.equalTo('owner', options.user);
    query.equalTo('fullAddress', options.parsed.alarmObject.fullAddress);

    return query.first({useMasterKey: true});
};

exports.findCentral = function (sender) {
    console.log('findCentral');

    var Central = Parse.Object.extend('Central');
    var query = new Parse.Query(Central);
    query.equalTo('sendFrom', sender);

    return query.first({useMasterKey: true});
};

exports.findUser = function (receiver) {
    console.log('findUser');

    var query = new Parse.Query(Parse.User);
    query.equalTo('sendTo', receiver);

    return query.first({useMasterKey: true});
};

exports.findClient = function (user, queryMap) {
    console.log('findClient', user, queryMap);

    var Client = Parse.Object.extend("Client");
    var query = new Parse.Query(Client);
    query.equalTo('owner', user);

    _.forOwn(queryMap, function(value, key) {
        if (!_.isUndefined(value)) {
            query.equalTo(key, value);
        }
    });


    return query.first({useMasterKey: true});
};

exports.createClient = function (user, alarm) {
    console.log('createClient');

    var id = alarm.get('clientId');
    var name = alarm.get('clientName');
    var fullAddress = alarm.get('fullAddress');

    return geocode.lookupPlaceObject(fullAddress).then(function (placeObject) {
        return Parse.Promise.as(placeObject);
    }, function() {
        // unable to look up address
        console.log('Failed to look up address for: ' + fullAddress);

        var fakePlaceObject  = {
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

    }).then(function(placeObject) {
        var Client = Parse.Object.extend("Client");
        var client = new Client();

        client.set('clientId', id);
        client.set('automatic', true);
        client.set('name', name);
        client.set('fullAddress', fullAddress);
        client.set('owner', user);

        var acl = new Parse.ACL(user);
        client.setACL(acl);

        _.forOwn(placeObject, function (value, key) {
            client.set(key, value);
        });

        return client.save(null, {useMasterKey: true});
    })
};
