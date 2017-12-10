
import {EventLog} from "../../shared/subclass/EventLog";
import {Report, ReportQuery} from "../../shared/subclass/Report";
import {Task} from "../../shared/subclass/Task";
import {TaskGroupStarted} from "../../shared/subclass/TaskGroupStarted";

Parse.Cloud.beforeSave("EventLog",  (request, response) => {

    let EventLog = <EventLog>request.object;

    // avoid 'undefined' for automatic
    let automatic = EventLog.has('automatic');
    console.log('hasAutomatic: ', automatic);
    if (!automatic) {
        EventLog.set('automatic', false);
    }

    response.success();


});

Parse.Cloud.afterSave("EventLog", (request) => {

    let EventLog = <EventLog>request.object;

    // wrieEventToSession(EventLog);
    writeEventToReport(EventLog);


});


let writeEventToReport = (eventLog: EventLog) => {

    let findReport =  (task: Task, taskGroupStarted?: TaskGroupStarted) => {

        console.log(`findReport TaskGroupStarted: ${taskGroupStarted ? taskGroupStarted.id: ''} task: ${task.id}`);

        return new ReportQuery()
            .matchingTask(task)
            .matchingTaskGroupStarted(taskGroupStarted)
            .build()
            .first({ useMasterKey: true });
    };

    let writeEvent =  async (report: Report) => {
        console.log('Writing event to report: ' + report.id);
        console.log('At client:  ' + report.get('clientAddress'));

        if (eventLog.get('eventCode') === 105) {
            report.set('extraTimeSpent', eventLog.get('amount'));
        }

        eventLog.set('reported', true);

        report.addUnique(Report._tasks, eventLog.task);
        report.addUnique(Report._eventLogs, eventLog);

        if (eventLog.taskGroupStarted) {
            report.addUnique(Report._taskGroups, eventLog.taskGroupStarted);
        }

        report.increment('eventCount');

        return report.save(null, { useMasterKey: true });
    };

    let createReport =  () => {
        console.log('createReport');

        let Report = Parse.Object.extend('Report');
        let report = new Report();

        Object.keys(eventLog.attributes).forEach( (fieldName) => {
            report.set(fieldName, eventLog.get(fieldName));
        });

        return report.save(null, { useMasterKey: true });
    };

    let task: Task = eventLog.task;

    if (task && !eventLog.get('reported')) {
        findReport(task, eventLog.taskGroupStarted)
        .then((report: Report) => {
            if (report) {
                console.log('Found report: ' + report.id );
                return writeEvent(report);
            }

            console.log('No report found');

            return createReport()
                .then(writeEvent)
                .fail((error) => {
                    console.error('Error while creating report: ' + JSON.stringify(error))
                    return error;
                });
        }, (error)  => {
            console.error('Unhandled error: ' + JSON.stringify(error));
        })
    } else {
        if (task) {
            console.log('Already written to report');
        } else {
            console.log('Not a report event');
        }
    }

};