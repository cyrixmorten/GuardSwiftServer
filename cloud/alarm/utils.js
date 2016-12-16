var _ = require('lodash');
var geocode = require('../utils/geocode.js');

exports.findAlarm = function(central, user, parsed) {
    var Alarm = Parse.Object.extend('Task');
    var query = new Parse.Query(Alarm);
    query.equalTo('centralName', central.get('name'));
    query.equalTo('owner', user);
    query.equalTo('original', parsed.alarmMsg);

    return query.first({useMasterKey: true});
};

exports.findCentral = function(sender) {
    console.log('findCentral');

    var Central = Parse.Object.extend('Central');
    var query = new Parse.Query(Central);
    query.equalTo('sendFrom', sender);

    return query.first({ useMasterKey: true });
};

exports.findUser = function(receiver) {
    console.log('findUser');

    var query = new Parse.Query(Parse.User);
    query.equalTo('sendTo', receiver);

    return query.first({ useMasterKey: true });
};

exports.findClient = function(user, fullAddress) {
    console.log('findClient', user, fullAddress);

    var Client = Parse.Object.extend("Client");
    var query = new Parse.Query(Client);
    query.equalTo('owner', user);
    query.equalTo('fullAddress', fullAddress);

    return query.first({ useMasterKey: true });
};

exports.createClient = function(user, alarm) {
    console.log('createClient');

    var name = alarm.get('clientName');
    var fullAddress = alarm.get('fullAddress');


    return geocode.lookupPlaceObject(fullAddress).then(function(placeObject) {

        console.log('placeObject: ' + JSON.stringify(placeObject));

        var Client = Parse.Object.extend("Client");
        var client = new Client();

        client.set('automatic', true);
        client.set('name', name);
        client.set('fullAddress', fullAddress);
        client.set('owner', user);

        var acl = new Parse.ACL(user);
        client.setACL(acl);

        _.forOwn(placeObject, function(value, key) {
            client.set(key, value);
        });

        return client.save({useMasterKey: true});
    });
};
