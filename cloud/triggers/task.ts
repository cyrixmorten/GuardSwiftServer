import {Task, TaskStatus, TaskType} from "../../shared/subclass/Task";
import * as parse from "parse";
import * as _ from "lodash";
import * as moment from "moment";
import {GuardQuery} from "../../shared/subclass/Guard";

import * as cpsms from '../../api/cpsms';
import {centrals} from "../centrals/all";
import {ClientQuery} from "../../shared/subclass/Client";
import {TaskGroupStartedQuery} from "../../shared/subclass/TaskGroupStarted";


Parse.Cloud.beforeSave(Task, async (request, response) => {

    let task = <Task>request.object;

    if (!task.client) {
        console.error('Task must point to a client!');
    }

    if (!task.existed()) {
        task.reset();
    }

    // TaskGroup updated
    if (task.taskGroup && task.dirty(Task._taskGroup) || task.dirty(Task._days)) {

        const taskGroup = await task.taskGroup.fetch({useMasterKey: true});
        const taskGroupStarted = await new TaskGroupStartedQuery().activeMatchingTaskGroup(task.taskGroup).build().first({useMasterKey: true});

        task.reset(taskGroup, taskGroupStarted);
    }

    // task is either newly created or pointed to another client
    if (task.client && task.dirty(Task._client)) {
        task.client = await new ClientQuery().matchingId(task.client.id).build().first({useMasterKey: true});
    }

    response.success();

});

Parse.Cloud.afterSave(Task, async (request) => {

    let task = <Task>request.object;

    let status: TaskStatus = task.status;

    if (!_.includes(task.get('knownStatus'), status)) {

        if (task.isType(TaskType.ALARM)) {
            await alarmUpdate(task, status);
        }

        task.addUnique('knownStatus', status);

        await task.save(null, {useMasterKey: true});
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

        return installationQuery.find({useMasterKey: true})
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
                }, {useMasterKey: true})
                    .then(() => {
                        console.log('Push notification successfully sent for alarm', alarm.id);
                    }, (e) => {
                        console.error('Error sending push notification', e);
                    })
            });
    };

    let sendSMS = () => {
        let prefix = alarm.get('status') === TaskStatus.ABORTED ? 'ANNULERET\n' : ''; // TODO translate

        let guardQuery = new GuardQuery()
            .matchingOwner(alarm.get('owner'))
            .whereAlarmSMS(true)
            .build()
            .include('installation');

        return guardQuery.find({useMasterKey: true}).then((guards) => {
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

                    smsPromises.push(smsPromise)
                }
                else {
                    console.error('Unable to send SMS to guard', guard.get('name'), 'no mobile number for installation or guard');
                }
            });

            return Parse.Promise.when(smsPromises);
        });
    };


    return (<parse.Promise<any>>sendPushNotification()).always(() => {
        if (process.env.NODE_ENV === 'production') {
            return sendSMS()
        }
    });
};

let alarmUpdate = async (task: Task, status: TaskStatus) => {

    switch (status) {
        case TaskStatus.PENDING: {

            _.forEach(centrals, (central) => {
                central.handlePending(task);
            });

            sendNotification(task).then(() => {
                console.log('Done sending notification for alarm', task.id);
            }, (e) => {
                console.error('Error sending notification for alarm', task.id, e);
            });

            break;
        }
        case TaskStatus.ACCEPTED: {

            _.forEach(centrals, (central) => {
                central.handleAccepted(task);
            });
            break;
        }
        case TaskStatus.ARRIVED: {

            _.forEach(centrals, (central) => {
                central.handleArrived(task);
            });
            break;
        }
        case TaskStatus.ABORTED: {

            await sendNotification(task);

            _.forEach(centrals, (central) => {
                central.handleAborted(task);
            });
            break;
        }
        case TaskStatus.FINISHED: {

            _.forEach(centrals, (central) => {
                central.handleFinished(task);
            });
            break;
        }
        default: {
            console.error('Failed to match alarm status:', status);
        }
    }


};