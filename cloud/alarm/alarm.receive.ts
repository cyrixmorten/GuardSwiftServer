import * as _ from 'lodash';
import {createAlarm} from "./alarm.create";
import {Central, CentralQuery} from "../../shared/subclass/Central";
import {Task, TaskQuery} from "../../shared/subclass/Task";
import {UserQuery} from "../../shared/subclass/User";
import {IParsedAlarm} from "../centrals/central.interface";
import {parseAlarm} from "./alarm.parse";

export type AlarmRequest = {
    params: {
        sender: string;
        receiver: string;
        alarm: string;
    }
}

export const handleAlarmRequest = async (request: AlarmRequest): Promise<string> => {

    let sender = request.params.sender;
    let receiver = request.params.receiver;
    let alarmMsg = request.params.alarm;

    console.log('-------');
    console.log('sender: ' + sender);
    console.log('receiver: ' + receiver);
    console.log('alarm: ' + alarmMsg);
    console.log('-------');

    if (!sender || !receiver || !alarmMsg) {
        let error = '';

        if (!sender) {
            error += 'Missing sender ';
        }
        if (!receiver) {
            error += 'Missing receiver ';
        }
        if (!alarmMsg) {
            error += 'Missing alarm ';
        }

        throw error;
    }

    let central: Central = await new CentralQuery().matchingSendFrom(sender).build().first({useMasterKey: true});

    if (!central) {
        throw 'Unable to find central matching sender: ' + sender
    }

    let user: Parse.User = await new UserQuery().matchingSendTo(receiver).build().first({useMasterKey: true});
    let parsedAlarm: IParsedAlarm = await parseAlarm(central, alarmMsg);

    let action = parsedAlarm.action;

    if (action === 'create') {
        let alarm = await createAlarm(user, central, sender, receiver, parsedAlarm);

        return 'Successfully created alarm';
    }


    if (action === 'abort') {
        let alarm: Task = await new TaskQuery()
            .matchingOwner(user)
            .matchingCentral(central)
            .matchingFullAddress(parsedAlarm.alarmObject.fullAddress)
            .build()
            .descending('createdAt')
            .first({useMasterKey: true});


        alarm.set(Task._status, 'aborted');

        let updatedAlarm = await alarm.save(null, {useMasterKey: true});

        return 'Alarm aborted';
    }

};




