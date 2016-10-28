var _ = require('lodash');

var geocode = require('../utils/geocode.js');


var handleAlarmRequest = function(request) {

    var body = JSON.parse(request.body);

    var sender = body.sender;
    var receiver = body.receiver;
    var alarmMsg = body.alarm;

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
    var alarm = {};

    return findCentral(sender).then(function(centralObj) {
        if (_.isEmpty(centralObj)) {
            return Parse.Promise.error('Unable to find central with sendFrom value: ' + sender);
        }

        central = centralObj;

        console.log('central: ' + central.get('name'));

        return findUser(receiver);
    }).then(function(userObj) {
        if (_.isEmpty(userObj)) {
            return Parse.Promise.error('Unable to find user with sendTo value: ' + receiver);
        }

        user = userObj;

        console.log('user: ' + user.get('username'));

        return parseAlarm(alarmMsg, central.get('name'));
    }).then(function(alarmObj) {
        var fullAddress = alarmObj.get('fullAddress');

        if (!fullAddress) {
            return Parse.Promise.error('Address missing from alarm: ' + alarmMsg);
        }

        alarm = alarmObj;

        alarm.set('central', central);
        
        return findClient(user, fullAddress);
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
        alarm.set('owner', user);

        var acl = new Parse.ACL(user);
        alarm.setACL(acl);

        // copy client attributes to alarm and save
        Object.keys(client.attributes).forEach(function (fieldName) {
            alarm.set(fieldName, client.get(fieldName));
        });
        
        alarm.set('original', alarmMsg);

        return alarm.save();
    })

};

var parseAlarm = function(alarmMsg, senderName) {

    var Alarm = Parse.Object.extend("Task");
    var alarm = new Alarm();
    alarm.set('taskType', 'Alarm');



    var alarmObject = {};
    if (senderName === 'G4S') {
        alarmObject = parseG4SAlarm(alarmMsg, alarm);
    }

    console.log('alarmObject: ' + JSON.stringify(alarmObject));

    _.forOwn(alarmObject, function(value, key) {
        alarm.set(key, value);
    });

    if (_.isEmpty(alarmObject)) {
        return Parse.Promise.error('Unable to parse alarm, unknown sender');
    }

    return Parse.Promise.as(alarm);
};
       
var parseG4SAlarm = function(alarmMsg) {
    var pieces = _.split(alarmMsg, ',');

    return {
        taskId: pieces[0],
        clientName: pieces[1],
        clientId: pieces[2],
        fullAddress: pieces[3],
        securityLevel: _.toNumber(pieces[4]),
        signalStatus: pieces[5],
        remarks: pieces[6],
        keybox: pieces[7]
    }

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
        response.success('Successfully created new alarm');
    }).fail(function(error) {
        console.error(JSON.stringify(error));

        response.error('Failed to create alarm')
    })
});