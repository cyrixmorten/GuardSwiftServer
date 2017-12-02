import * as _ from 'lodash';
import {parseAlarm} from "./alarm.parse";
import {createAlarm} from "./alarm.create";
import {AlarmUtils} from "./utils";
import IPromise = Parse.IPromise;
import {User} from "../../shared/subclass/User";
import {Central} from "../../shared/subclass/Central";

Parse.Cloud.define("alarm",  (request, response) => {
    handleAlarmRequest(request).then( (res) => {
        response.success(res);
    }, (error) => {
        console.error(error);

        response.error(error);
    });
});

let handleAlarmRequest = function (request): IPromise<any> {

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

        return Parse.Promise.error(error);
    }

    let central: Central;
    let user: User;

    return AlarmUtils.findCentral(sender).then(function (centralObj: any) {
        if (_.isEmpty(centralObj)) {
            return Parse.Promise.error('Unable to find central with sendFrom value: ' + sender);
        }
        central = centralObj;
        console.log('central: ' + central.get('name'));

        return AlarmUtils.findUser(receiver);
    }).then(function (userObj: User) {
        if (!userObj) {
            return Parse.Promise.error('Unable to find user with sendTo value: ' + receiver);
        }
        user = userObj;
        console.log('user: ' + user.get('username'));

        return parseAlarm(central, alarmMsg);
    }).then(function (parsed) {
        console.log('parsed.action: ', parsed.action);
        if (parsed.action === 'create') {
            return createAlarm({
                sender: sender,
                receiver: receiver,
                central: central,
                user: user,
                parsedAlarm: parsed
            }).then(function() {
                return 'Successfully created alarm';
            });
        }
        if (parsed.action === 'abort') {
            return AlarmUtils.findAlarm({
                central: central,
                user: user,
                parsed: parsed
            }).then(function (alarm) {
                alarm.set('status', 'aborted');
                return alarm.save(null, {useMasterKey: true});
            }).then(function () {
                return 'Alarm aborted';
            });

        }
    })


};




