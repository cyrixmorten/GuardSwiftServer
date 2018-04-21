import * as _ from 'lodash';
import {Client, ClientQuery} from '../../shared/subclass/Client';
import {Central} from "../../shared/subclass/Central";
import {Task, TaskType} from "../../shared/subclass/Task";
import {IParsedAlarm} from "../centrals/central.interface";


export let createAlarm = async (user: Parse.User, central: Central, sender: string, receiver: string, parsedAlarm: IParsedAlarm): Promise<Task> => {

    let alarm = new Task();

    alarm.set(Task._taskType, TaskType.ALARM);
    alarm.set(Task._sentFrom, sender);
    alarm.set(Task._sentTo, receiver);

    alarm.set(Task._central, central);
    alarm.set(Task._centralName, central.name);

    alarm.set(Task._owner, user);


    let alarmObject = parsedAlarm.alarmObject;
    let alarmMsg = parsedAlarm.alarmMsg;

    console.log('alarmObj: ', alarmObject);

    if (!alarmObject.fullAddress) {
        return Parse.Promise.error('Address missing from alarm: ' + alarmMsg);
    }

    _.forOwn(alarmObject, (value, key) => {
        alarm.set(key, value);
    });

    alarm.set(Task._original, alarmMsg);

    let client: Client = await new ClientQuery()
        .matchingOwner(user)
        .matchingClientId(user.get(Client._clientId))
        .matchingFullAddress(parsedAlarm.alarmObject.fullAddress)
        .build()
        .first({useMasterKey: true});


    if (_.isEmpty(client) || !client.has(Client._placeId)) {
        client = await Client.createFromAlarm(user, alarm);
    }
    else {
        console.log('existing client');
    }

    console.log('client: ' + client.name);

    alarm.set(Task._client, client);
    alarm.setUserACL(user);

    // copy client attributes to alarm and save
    Object.keys(client.attributes).forEach( (fieldName) => {
        alarm.set(fieldName, client.get(fieldName));
    });


    return alarm.save(null, {useMasterKey: true});
};