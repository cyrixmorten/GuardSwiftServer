"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Task_1 = require("../../shared/subclass/Task");
const _ = require("lodash");
const moment = require("moment");
const Guard_1 = require("../../shared/subclass/Guard");
const cpsms = require("../../api/cpsms");
const all_1 = require("../centrals/all");
let states = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    ARRIVED: 'arrived',
    ABORTED: 'aborted',
    FINISHED: 'finished'
};
exports.states = states;
Parse.Cloud.beforeSave(Task_1.Task.className, (request, response) => {
    let task = request.object;
    if (!task.existed()) {
        task.reset();
    }
    response.success();
});
Parse.Cloud.afterSave(Task_1.Task, (request) => {
    let task = request.object;
    if (task.isType(Task_1.TaskType.ALARM)) {
        alarmUpdate(task);
    }
});
let sendNotification = (alarm) => {
    console.log('sendNotification alarm', alarm.id);
    let sendPushNotification = () => {
        console.log('sendPushNotification');
        let installationQuery = new Parse.Query(Parse.Installation);
        installationQuery.equalTo('owner', alarm.get('owner'));
        installationQuery.equalTo('channels', 'alarm');
        installationQuery.greaterThan('updatedAt', moment().subtract(7, 'days').toDate());
        return installationQuery.find({ useMasterKey: true })
            .then((installations) => {
            console.log('Sending push to installations', installations.length);
            _.forEach(installations, (installation) => {
                console.log('installation: ', installation.get('name'), installation.id);
            });
            return Parse.Promise.when();
        }).then(() => {
            return Parse.Push.send({
                where: installationQuery,
                expiration_interval: 600,
                data: {
                    alarmId: alarm.id
                }
            }, { useMasterKey: true })
                .then(() => {
                console.log('Push notification successfully sent for alarm', alarm.id);
            }, (e) => {
                console.error('Error sending push notification', e);
            });
        });
    };
    let sendSMS = () => {
        let prefix = alarm.get('status') === states.ABORTED ? 'ANNULERET\n' : '';
        let guardQuery = new Guard_1.GuardQuery()
            .matchingOwner(alarm.get('owner'))
            .whereAlarmSMS(true)
            .build()
            .include('installation');
        return guardQuery.find({ useMasterKey: true }).then((guards) => {
            console.log('Sending SMS for alarm:', alarm.id, ' to ', guards.length, 'guards');
            let smsPromises = [];
            _.forEach(guards, (guard) => {
                let installation = guard.get('installation');
                let guardMobile = guard.get('mobileNumber');
                let installationMobile = installation ? installation.get('mobileNumber') : '';
                console.log('Sending to', guard.get('name'), guardMobile, installationMobile);
                if (guardMobile || installationMobile) {
                    let sendTo = (installationMobile) ? installationMobile : guardMobile;
                    let smsPromise = cpsms.send({
                        to: sendTo,
                        message: prefix + alarm.get("original"),
                        flash: true
                    });
                    smsPromises.push(smsPromise);
                }
                else {
                    console.error('Unable to send SMS to guard', guard.get('name'), 'no mobile number for installation or guard');
                }
            });
            return Parse.Promise.when(smsPromises);
        });
    };
    return sendPushNotification().always(() => {
        return sendSMS();
    });
};
let alarmUpdate = (task) => {
    let status = task.get('status');
    if (!_.includes(task.get('knownStatus'), status)) {
        switch (status) {
            case states.PENDING: {
                _.forEach(all_1.centrals, (handler) => {
                    handler.handlePending(task);
                });
                sendNotification(task).then(() => {
                    console.log('Done sending notification for alarm', task.id);
                }, (e) => {
                    console.error('Error sending notification for alarm', task.id, e);
                });
                break;
            }
            case states.ACCEPTED: {
                _.forEach(all_1.centrals, (handler) => {
                    handler.handleAccepted(task);
                });
                break;
            }
            case states.ARRIVED: {
                _.forEach(all_1.centrals, (handler) => {
                    handler.handleArrived(task);
                });
                break;
            }
            case states.ABORTED: {
                sendNotification(task);
                _.forEach(all_1.centrals, (handler) => {
                    handler.handleAborted(task);
                });
                break;
            }
            case states.FINISHED: {
                _.forEach(all_1.centrals, (handler) => {
                    handler.handleFinished(task);
                });
                break;
            }
        }
        task.addUnique('knownStatus', status);
        task.save(null, { useMasterKey: true });
    }
};
//# sourceMappingURL=task.js.map