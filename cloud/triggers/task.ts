import { Task, TaskQuery, TaskStatus, TaskType } from "../../shared/subclass/Task";
import * as _ from "lodash";
import * as moment from "moment";
import { Guard, GuardQuery } from "../../shared/subclass/Guard";
import * as cpsms from '../../api/alarm/sms';
import { centralAlarmHandlers } from "../centrals/all";
import { TaskGroupStartedQuery } from "../../shared/subclass/TaskGroupStarted";
import { ReportHelper } from '../utils/ReportHelper';
import { TaskGroup, TaskGroupQuery } from '../../shared/subclass/TaskGroup';
import { BeforeSave } from './BeforeSave';
import * as parse from "parse";


Parse.Cloud.beforeSave(Task, async (request: parse.Cloud.BeforeSaveRequest) => {
    BeforeSave.setArchiveFalse(request);
    BeforeSave.settUserAsOwner(request);

    let task = request.object as Task;

    if (!task.isNew() && !task.client) {
        // In some edge cases the daily reset of tasks will throw away the client pointer
        // Have not been able to figure out why so made this bit to resurrect the pointer if it is missing
        // UPDATE: Looks like it is when updating task via AngularJS Web app
        const thisTaskBefore = await new TaskQuery().matchingId(task.id).build().first({useMasterKey: true});

        console.warn("restore client for task", task.id, thisTaskBefore.client);

        task.client = thisTaskBefore.client;
    }

    if (!task.existed()) {
        task.reset(new Date());

        const client = await task.client.fetch({useMasterKey: true});

        const clientTaskRadius = client.taskRadius && client.taskRadius[task.taskType];
        if (clientTaskRadius) {
            task.geofenceRadius = clientTaskRadius;
        }
    }

    // TaskGroup updated
    if (task.taskGroup && (task.dirty(Task._taskGroup) || task.dirty(Task._days))) {

        const taskGroup = await new TaskGroupQuery().include(TaskGroup._owner).build().first({useMasterKey: true});
        const taskGroupStarted = await new TaskGroupStartedQuery().activeMatchingTaskGroup(task.taskGroup).build().first({useMasterKey: true});

        task.dailyReset(new Date(), taskGroup.owner, taskGroup, taskGroupStarted);
    }

    // task is either newly created or pointed to another client
    if (task.client && task.dirty(Task._client)) {
        task.client = await task.client.fetch({useMasterKey: true});
    }

});

Parse.Cloud.afterSave(Task, async (request) => {

    let task = request.object as Task;

    let status: TaskStatus = task.status;

    if (!_.includes(task.knownStatus, status)) {

        if (task.isType(TaskType.ALARM)) {
            await alarmUpdate(task, status);
        }

        task.addKnownStatus(status);

        if (status === TaskStatus.FINISHED) {
            await ReportHelper.closeReportIfLastTask(task);
        }

        await task.save(null, {useMasterKey: true});
    }


});


let sendNotification = async (alarm: Task) => {

    console.log('sendNotification alarm', alarm.id);

    let sendPushNotification = async () => {
        console.log('sendPushNotification');

        let installationQuery = new Parse.Query(Parse.Installation);
        installationQuery.equalTo('owner', alarm.owner);
        installationQuery.equalTo('channels', 'alarm');
        installationQuery.greaterThan('updatedAt', moment().subtract(7, 'days').toDate());

        return Parse.Push.send({
            where: installationQuery,
            expiration_interval: 600,
            data: {
                alarmId: alarm.id
            }
        }, {useMasterKey: true});
    };

    let sendSMS = async () => {
        let prefix = alarm.status === TaskStatus.ABORTED ? 'ANNULERET\n' : ''; // TODO translate

        const guards: Guard[] = await new GuardQuery()
            .matchingOwner(alarm.owner)
            .whereAlarmSMS(true)
            .build()
            .include('installation')
            .find({useMasterKey: true});

        console.log('Sending SMS for alarm:', alarm.id, ' to ', guards.length, 'guards');

        return Promise.all(_.map(guards, (guard: Guard) => {
            let installation = guard.installation;
            let guardMobile = guard.mobileNumber;
            let installationMobile = installation ? installation.get('mobileNumber') : '';

            console.log('Sending to', guard.name, guardMobile, installationMobile);

            if (guardMobile || installationMobile) {
                let sendTo = (installationMobile) ? installationMobile : guardMobile;

                return cpsms.send({
                    to: sendTo,
                    message: prefix + alarm.original,
                    flash: true
                });
            } else {
                console.error('Unable to send SMS to guard', guard.name, 'no mobile number for installation or guard');
            }
        }));
    };


    await sendPushNotification();

    if (process.env.NODE_ENV === 'production') {
        return sendSMS()
    }
};

let alarmUpdate = async (task: Task, status: TaskStatus) => {

    switch (status) {
        case TaskStatus.PENDING: {

            _.forEach(centralAlarmHandlers, (central) => {
                central.handlePending(task);
            });

            try {
                await sendNotification(task);

                console.log('Done sending notification for alarm', task.id);
            } catch (e) {
                console.error('Error sending notification for alarm', task.id, e);
            }

            break;
        }
        case TaskStatus.ACCEPTED: {

            _.forEach(centralAlarmHandlers, (central) => {
                central.handleAccepted(task);
            });
            break;
        }
        case TaskStatus.ARRIVED: {

            _.forEach(centralAlarmHandlers, (central) => {
                central.handleArrived(task);
            });
            break;
        }
        case TaskStatus.ABORTED: {

            await sendNotification(task);

            _.forEach(centralAlarmHandlers, (central) => {
                central.handleAborted(task);
            });
            break;
        }
        case TaskStatus.FINISHED: {

            _.forEach(centralAlarmHandlers, (central) => {
                central.handleFinished(task);
            });
            break;
        }
        default: {
            console.error('Failed to match alarm status:', status);
        }
    }


};