var _ = require('lodash');
var geocode = require('../utils/geocode.js');
var parser = require('./parse');


var handleAlarmRequest = function(request) {

    var sender = request.params.sender;
    var receiver = request.params.receiver;
    var alarmMsg = request.params.alarm;

    console.log('-------');
    console.log('sender: ' + sender);
    console.log('receiver: ' + receiver);
    console.log('alarm: ' + alarmMsg);
    console.log('-------');

    if (!sender || !receiver || !alarmMsg) {
        var error = '';
        
        if (!sender) {
            error += 'Missing sender ';
        }
        if (!receiver) {
            error += 'Missing receiver ';
        }
        if (!alarmMsg) {
            error += 'Missing alarm ';
        }
        
        return Parse.Promise.error(error);
    }



    var central = {};
    var user = {};

    var Alarm = Parse.Object.extend("Task");
    var alarm = new Alarm();
    alarm.set('taskType', 'Alarm');
    alarm.set('sentFrom', sender);

    return findCentral(sender).then(function(centralObj) {
        if (_.isEmpty(centralObj)) {
            return Parse.Promise.error('Unable to find central with sendFrom value: ' + sender);
        }

        central = centralObj;

        alarm.set('central', central);
        alarm.set('centralName', central.get('name'));

        console.log('central: ' + central.get('name'));

        return findUser(receiver);
    }).then(function(userObj) {
        if (_.isEmpty(userObj)) {
            return Parse.Promise.error('Unable to find user with sendTo value: ' + receiver);
        }

        user = userObj;

        alarm.set('owner', user);

        console.log('user: ' + user.get('username'));

        return parser.parse(alarm, alarmMsg);
    }).then(function(result) {

        var alarmObject = result.alarmObject;
        var alarmMsg = result.alarmMsg;

        console.log('alarmObj: ', alarmObject);

        if (!alarmObject.fullAddress) {
            return Parse.Promise.error('Address missing from alarm: ' + alarmMsg);
        }

        _.forOwn(alarmObject, function(value, key) {
            alarm.set(key, value);
        });

        alarm.set('original', alarmMsg);

        return findClient(user, alarmObject.fullAddress);
    }).then(function(client) {
        if (_.isEmpty(client) || !client.has('placeId')) {
            return createClient(user, alarm);
        }

        console.log('existing client');

        // client already exists
        return Parse.Promise.as(client);
    }).then(function(client) {

        console.log('client: ' + client.get('name'));

        alarm.set('client', client);

        var acl = new Parse.ACL(user);
        alarm.setACL(acl);

        // copy client attributes to alarm and save
        Object.keys(client.attributes).forEach(function (fieldName) {
            alarm.set(fieldName, client.get(fieldName));
        });
        

        return alarm.save();
    })

};



var findCentral = function(sender) {
    console.log('findCentral');

    var Central = Parse.Object.extend('Central');
    var query = new Parse.Query(Central);
    query.equalTo('sendFrom', sender);

    return query.first();
};

var findUser = function(receiver) {
    console.log('findUser');

    var query = new Parse.Query(Parse.User);
    query.equalTo('sendTo', receiver);

    return query.first();
};

var findClient = function(user, fullAddress) {
    console.log('findClient');

    var Client = Parse.Object.extend("Client");
    var query = new Parse.Query(Client);
    query.equalTo('owner', user);
    query.equalTo('fullAddress', fullAddress);

    return query.first();
};

var createClient = function(user, alarm) {
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

        return client.save();
    });
};

Parse.Cloud.define("alarm", function(request, response) {
    handleAlarmRequest(request).then(function() {
        response.success('Successfully created alarm');
    }).fail(function(error) {
        console.error(error);

        response.error(error);
    })
});