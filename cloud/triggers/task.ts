import {Task, TaskStatus, TaskType} from "../../shared/subclass/Task";
import * as parse from "parse";
import * as _ from "lodash";
import * as moment from "moment";
import {GuardQuery} from "../../shared/subclass/Guard";

import * as cpsms from '../../api/cpsms';
import {centrals} from "../centrals/all";
import {ClientQuery} from "../../shared/subclass/Client";


Parse.Cloud.beforeSave(Task.className,  (request, response) => {
    
    let task = <Task>request.object;

    if (!task.existed()) {
        task.reset();
    }

    // task is either newly created or pointed to another client
    if (task.dirty(Task._client)) {

        new ClientQuery().matchingId(task.client.id).build().first({useMasterKey: true}).then((client) => {

            task.client = client;

            response.success();

        }, (error) => {
            response.error(error);
        })

    } else {

        response.success();
    }

});

Parse.Cloud.afterSave(Task, (request)  => {

    let task = <Task>request.object;

    if (task.isType(TaskType.ALARM)) {
        alarmUpdate(task);
    }
});


let sendNotification = (alarm) => {

    console.log('sendNotification alarm', alarm.id);

    let sendPushNotification = ()  => {
        console.log('sendPushNotification');

        let installationQuery = new Parse.Query(Parse.Installation);
        installationQuery.equalTo('owner', alarm.get('owner'));
        installationQuery.equalTo('channels', 'alarm');
        installationQuery.greaterThan('updatedAt', moment().subtract(7, 'days').toDate());

        return installationQuery.find({ useMasterKey: true })
            .then((installations)  => {
            console.log('Sending push to installations', installations.length);
            _.forEach(installations, (installation) => {
                console.log('installation: ', installation.get('name'), installation.id);
            });

            return Parse.Promise.when();
        }).then(()  => {
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
            })
        });
    };

    let sendSMS =  () => {
        let prefix = alarm.get('status') === TaskStatus.ABORTED ? 'ANNULERET\n' : '';

        let guardQuery = new GuardQuery()
            .matchingOwner(alarm.get('owner'))
            .whereAlarmSMS(true)
            .build()
            .include('installation');

        return guardQuery.find({ useMasterKey: true }).then( (guards) => {
            console.log('Sending SMS for alarm:', alarm.id, ' to ', guards.length, 'guards');

            let smsPromises = [];

            _.forEach(guards, (guard) => {
                let installation = guard.get('installation');
                let guardMobile = guard.get('mobileNumber');
                let installationMobile = installation ? installation.get('mobileNumber') : '';

                console.log('Sending to',  guard.get('name'), guardMobile, installationMobile);

                if (guardMobile || installationMobile) {
                    let sendTo = (installationMobile) ? installationMobile : guardMobile;

                    let smsPromise = cpsms.send({
                        to: sendTo,
                        message: prefix + alarm.get("original"),
                        flash: true
                    });

                    smsPromises.push(smsPromise)
                } else {
                    console.error('Unable to send SMS to guard', guard.get('name'), 'no mobile number for installation or guard');
                }
            });

            return Parse.Promise.when(smsPromises);
        });
    };


    return (<parse.Promise<any>>sendPushNotification()).always(() => {
        return sendSMS()
    });
};

let alarmUpdate = (task: Task) => {
    let status = task.get('status');

    if (!_.includes(task.get('knownStatus'), status)) {

        switch (status) {
            case TaskStatus.PENDING: {

                _.forEach(centrals, (handler) => {
                    handler.handlePending(task);
                });

                sendNotification(task).then(() =>{
                    console.log('Done sending notification for alarm', task.id);
                }, (e) => {
                    console.error('Error sending notification for alarm', task.id, e);
                });

                break;
            }
            case TaskStatus.ACCEPTED: {
                _.forEach(centrals, (handler) => {
                    handler.handleAccepted(task);
                });
                break;
            }
            case TaskStatus.ARRIVED: {
                _.forEach(centrals, (handler)  => {
                    handler.handleArrived(task);
                });
                break;
            }
            case TaskStatus.ABORTED: {

                sendNotification(task);

                _.forEach(centrals, (handler) => {
                    handler.handleAborted(task);
                });
                break;
            }
            case TaskStatus.FINISHED: {
                _.forEach(centrals, (handler)  => {
                    handler.handleFinished(task);
                });
                break;
            }
        }

        task.addUnique('knownStatus', status);
        task.save(null, {useMasterKey: true});
    }
};