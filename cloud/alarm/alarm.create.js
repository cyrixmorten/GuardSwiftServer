"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const utils_1 = require("./utils");
exports.createAlarm = function (options) {
    let Alarm = Parse.Object.extend("Task");
    let alarm = new Alarm();
    alarm.set('taskType', 'Alarm');
    alarm.set('sentFrom', options.sender);
    alarm.set('sentTo', options.receiver);
    alarm.set('central', options.central);
    alarm.set('centralName', options.central.get('name'));
    alarm.set('owner', options.user);
    let alarmObject = options.parsedAlarm.alarmObject;
    let alarmMsg = options.parsedAlarm.alarmMsg;
    console.log('alarmObj: ', alarmObject);
    if (!alarmObject.fullAddress) {
        return Parse.Promise.error('Address missing from alarm: ' + alarmMsg);
    }
    _.forOwn(alarmObject, function (value, key) {
        alarm.set(key, value);
    });
    alarm.set('original', alarmMsg);
    return utils_1.AlarmUtils.findClient(options.user, {
        clientId: alarmObject.clientId,
        fullAddress: alarmObject.fullAddress
    }).then(function (client) {
        if (_.isEmpty(client) || !client.has('placeId')) {
            return utils_1.AlarmUtils.createClient(options.user, alarm);
        }
        console.log('existing client');
        // client already exists
        return Parse.Promise.as(client);
    }).then(function (client) {
        console.log('client: ' + client.get('name'));
        alarm.set('client', client);
        let acl = new Parse.ACL(options.user);
        alarm.setACL(acl);
        // copy client attributes to alarm and save
        Object.keys(client.attributes).forEach(function (fieldName) {
            alarm.set(fieldName, client.get(fieldName));
        });
        return alarm.save(null, { useMasterKey: true });
    });
};
//# sourceMappingURL=alarm.create.js.map