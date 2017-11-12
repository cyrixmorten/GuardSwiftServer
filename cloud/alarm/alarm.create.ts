import * as _ from 'lodash';
import {AlarmUtils} from "./utils";
import {Client} from '../../shared/subclass/Client';
import {Central} from "../../shared/subclass/Central";
import {IParsedAlarm} from "./alarm.parse";
import {User} from "../../shared/subclass/User";

export interface IAlarmOptions {
    sender: string,
    receiver: string,
    central: Central,
    user: User,
    parsedAlarm: IParsedAlarm
}

export let createAlarm = function (options: IAlarmOptions) {

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

    return AlarmUtils.findClient(options.user, {
        clientId: alarmObject.clientId,
        fullAddress: alarmObject.fullAddress
    }).then(function (client) {

        if (_.isEmpty(client) || !client.has('placeId')) {
            return AlarmUtils.createClient(options.user, alarm);
        }

        console.log('existing client');

        // client already exists
        return client;
    }).then(function (client: Client) {

        console.log('client: ' + JSON.stringify(client.toJSON()));

        alarm.set('client', client);

        let acl = new Parse.ACL(options.user);
        alarm.setACL(acl);

        // copy client attributes to alarm and save
        Object.keys(client.attributes).forEach(function (fieldName) {
            alarm.set(fieldName, client.get(fieldName));
        });


        return alarm.save(null, {useMasterKey: true});
    });
};