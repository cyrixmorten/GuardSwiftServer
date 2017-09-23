"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const alarm_parse_1 = require("./alarm.parse");
const alarm_create_1 = require("./alarm.create");
const utils_1 = require("./utils");
Parse.Cloud.define("alarm", function (request, response) {
    handleAlarmRequest(request).then(function (res) {
        response.success(res);
    }, function (error) {
        console.error(error);
        response.error(error);
    });
});
let handleAlarmRequest = function (request) {
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
    let central;
    let user;
    return utils_1.AlarmUtils.findCentral(sender).then(function (centralObj) {
        if (_.isEmpty(centralObj)) {
            return Parse.Promise.error('Unable to find central with sendFrom value: ' + sender);
        }
        central = centralObj;
        console.log('central: ' + central.get('name'));
        return utils_1.AlarmUtils.findUser(receiver);
    }).then(function (userObj) {
        if (_.isEmpty(userObj)) {
            return Parse.Promise.error('Unable to find user with sendTo value: ' + receiver);
        }
        user = userObj;
        console.log('user: ' + user.get('username'));
        return alarm_parse_1.parseAlarm(central, alarmMsg);
    }).then(function (parsed) {
        console.log('parsed.action: ', parsed.action);
        if (parsed.action === 'create') {
            return alarm_create_1.createAlarm({
                sender: sender,
                receiver: receiver,
                central: central,
                user: user,
                parsedAlarm: parsed
            }).then(function () {
                return 'Successfully created alarm';
            });
        }
        if (parsed.action === 'abort') {
            return utils_1.AlarmUtils.findAlarm({
                central: central,
                user: user,
                parsed: parsed
            }).then(function (alarm) {
                alarm.set('status', 'aborted');
                return alarm.save(null, { useMasterKey: true });
            }).then(function () {
                return 'Alarm aborted';
            });
        }
    });
};
//# sourceMappingURL=receive.js.map