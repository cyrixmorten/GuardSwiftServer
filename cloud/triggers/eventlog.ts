import {EventLog, TaskEvent} from "../../shared/subclass/EventLog";
import {Report, ReportQuery} from "../../shared/subclass/Report";
import {Task, TaskQuery, TaskType} from "../../shared/subclass/Task";
import * as moment from 'moment';
import * as _ from 'lodash';
import {TaskGroupStarted} from '../../shared/subclass/TaskGroupStarted';

Parse.Cloud.beforeSave(EventLog, (request, response) => {

    let eventLog = <EventLog>request.object;

    if (!eventLog.automatic) {
        eventLog.automatic = false;
    }

    response.success();


});

Parse.Cloud.afterSave(EventLog, (request) => {

    let EventLog = <EventLog>request.object;

    return writeEventToReport(EventLog);


});


let writeEventToReport = async (eventLog: EventLog) => {

    let findReport = async (eventLog: EventLog) => {

        let reportQuery = new ReportQuery().matchingClient(eventLog.client);

        if (eventLog.matchingTaskType(TaskType.STATIC, TaskType.ALARM)) {
            // Simply write one report per task
            reportQuery.matchingTask(task);
        } else {
            // Append all task events to the same report

            // 1) Locate all tasks assigned to this client
            const tasks: Task[] = await new TaskQuery()
                .matchingClient(eventLog.client)
                .build()
                .find({useMasterKey: true});

            // 2) A unique list of all started task groups
            const taskGroupStartedPointers = _.uniq(_.map(tasks, task => {
                return task.taskGroupStarted;
            }));

            // 3) Figure out which of the task groups started the earliest
            let taskGroupsStarted = await Parse.Object.fetchAll(taskGroupStartedPointers, {useMasterKey: true});

            taskGroupsStarted = _.sortBy<TaskGroupStarted>(taskGroupsStarted, (taskGroupStarted) => taskGroupStarted.timeStarted);

            const firstTaskGroupStarted = _.first(taskGroupsStarted);

            console.log('Earliest possible time', moment(firstTaskGroupStarted.timeStarted).format('DD-MM HH:mm'));

            // 4) Look for existing report created after the earliest possible time
            reportQuery.createdAfterObject(firstTaskGroupStarted);
        }

        return reportQuery
            .build()
            .first({useMasterKey: true});
    };

    let writeEvent = async (report: Report, eventLog: EventLog) => {
        console.log('Writing event to report: ' + report.id);
        console.log('At client:  ' + report.clientAddress);

        if (eventLog.eventCode === 105) {
            report.set('extraTimeSpent', eventLog.amount);
        }

        eventLog.reported = true;

        report.addUnique(Report._eventLogs, eventLog);

        if (eventLog.task) {
            report.addUnique(Report._tasks, eventLog.task);
        }

        switch (eventLog.taskEvent) {
            case TaskEvent.ACCEPT: {
                report.timeStarted = new Date();
                break;
            }
            case TaskEvent.FINISH: {
                report.timeEnded = new Date();
                break;
            }
        }

        report.incrementEventCount();

        return report.save(null, {useMasterKey: true});
    };

    let createReport = async (eventLog: EventLog) => {

        let report: Report = await new Report().save(eventLog.attributes, {useMasterKey: true});

        await writeEvent(report, eventLog);
    };

    let task: Task = eventLog.task;

    if (task && !eventLog.reported) {
        try {
            let report: Report = await findReport(eventLog);

            if (report) {
                console.log('Found report: ' + report.id);
                await writeEvent(report, eventLog);
            }
            else {
                try {
                    console.log('createReport');
                    await createReport(eventLog);
                } catch (e) {
                    console.error('Error while creating report: ' + JSON.stringify(e));
                }
            }

        } catch (e) {
            console.error('Unhandled error: ' + JSON.stringify(e));
        }
    }
    else if (task) {
        console.log('Already written to report');
    } else {
        console.log('Not a report event');
    }

};