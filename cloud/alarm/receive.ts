import * as _ from 'lodash';
import { parseAlarm } from "./alarm.parse";
import { createAlarm } from "./alarm.create";
import { AlarmUtils } from "./utils";
import { User } from "../../shared/subclass/User";
import { Central } from "../../shared/subclass/Central";


export const handleAlarmRequest = async (request) => {

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


    const central: Central = await AlarmUtils.findCentral(sender) as Central;
    const user: User = await AlarmUtils.findUser(receiver) as User;

    if (!central) {
        throw 'Unable to find central with sendFrom value: ' + sender;
    }

    if (!user) {
        throw 'Unable to find user with sendTo value: ' + receiver;
    }

    const parsed = await parseAlarm(central, alarmMsg);

    if (parsed.action === 'create') {

        console.log('Create alarm');

        return createAlarm({
            sender: sender,
            receiver: receiver,
            central: central,
            user: user,
            parsedAlarm: parsed
        });
    }
    if (parsed.action === 'abort') {
        console.log('Abort alarm');

        const alarm = await AlarmUtils.findAlarm({
            central: central,
            user: user,
            parsed: parsed
        });

        alarm.set('status', 'aborted');

        return alarm.save(null, {useMasterKey: true});

    }

};




