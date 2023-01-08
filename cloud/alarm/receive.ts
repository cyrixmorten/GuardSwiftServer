import { parseAlarm } from "./alarm.parse";
import { createAlarm } from "./alarm.create";
import { AlarmUtils } from "./utils";

export const handleSMSAlarmRequest = async (request) => {

    const {sender, receiver, alarm} = request.params;


    console.log('---handleSMSAlarmRequest---');
    console.log('sender: ' + sender);
    console.log('receiver: ' + receiver);
    console.log('alarm: ' + alarm);
    console.log('-------');

    if (!sender || !receiver || !alarm) {
        let error = '';

        if (!sender) {
            error += 'Missing sender ';
        }
        if (!receiver) {
            error += 'Missing receiver ';
        }
        if (!alarm) {
            error += 'Missing alarm ';
        }

        throw error;
    }


    const central = await AlarmUtils.findCentralByPhoneNumber(sender);
    const user = await AlarmUtils.findUserByPhoneNumber(receiver);

    if (!central) {
        throw 'Unable to find central with sendFrom value: ' + sender;
    }

    if (!user) {
        throw 'Unable to find user with sendTo value: ' + receiver;
    }

    const parsed = await parseAlarm(central, alarm);

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

        const alarmObj = await AlarmUtils.findAlarm({
            central: central,
            user: user,
            parsed: parsed
        });

        alarmObj.set('status', 'aborted');

        return alarmObj.save(null, {useMasterKey: true});

    }

};
export const handleRESTAlarmRequest = async (request) => {

    const {key, alarm} = request.params;

    console.log('---handleRESTAlarmRequest---');
    console.log('key: ' + key);
    console.log('alarm: ' + alarm);
    console.log('-------');


    const central = await AlarmUtils.findCentralByAPIKey(key);
    const user = await AlarmUtils.findUserByName("JVH"); // TODO Hardcoded name

    if (!central) {
        throw 'Unable to find central with apiKey: ' + key;
    }

    if (!user) {
        throw 'Unable to find user with username: JVH';
    }

    const parsed = await parseAlarm(central, alarm);

    console.log({parsed});

    if (parsed.action === 'create') {

        console.log('Create alarm');

        return createAlarm({
            central: central,
            user: user,
            parsedAlarm: parsed
        });
    }

};



