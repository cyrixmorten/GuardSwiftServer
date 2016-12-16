var alarmUtils = require('./utils');
var _ = require('lodash');

exports.create = function (options) {

    var Alarm = Parse.Object.extend("Task");
    var alarm = new Alarm();
    alarm.set('taskType', 'Alarm');
    alarm.set('sentFrom', options.sender);
    alarm.set('sentTo', options.receiver);

    alarm.set('central', options.central);
    alarm.set('centralName', options.central.get('name'));

    alarm.set('owner', options.user);


    var alarmObject = options.parsedAlarm.alarmObject;
    var alarmMsg = options.parsedAlarm.alarmMsg;

    console.log('alarmObj: ', alarmObject);

    if (!alarmObject.fullAddress) {
        return Parse.Promise.error('Address missing from alarm: ' + alarmMsg);
    }

    _.forOwn(alarmObject, function (value, key) {
        alarm.set(key, value);
    });

    alarm.set('original', alarmMsg);

    return alarmUtils.findClient(options.user, alarmObject.fullAddress).then(function (client) {

        if (_.isEmpty(client) || !client.has('placeId')) {
            return alarmUtils.createClient(options.user, alarm);
        }

        console.log('existing client');

        // client already exists
        return Parse.Promise.as(client);
    }).then(function (client) {

        console.log('client: ' + client.get('name'));

        alarm.set('client', client);

        var acl = new Parse.ACL(options.user);
        alarm.setACL(acl);

        // copy client attributes to alarm and save
        Object.keys(client.attributes).forEach(function (fieldName) {
            alarm.set(fieldName, client.get(fieldName));
        });


        return alarm.save({useMasterKey: true});
    });
};