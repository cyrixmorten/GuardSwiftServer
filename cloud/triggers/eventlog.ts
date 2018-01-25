import {EventLog} from "../../shared/subclass/EventLog";
import {Report, ReportQuery} from "../../shared/subclass/Report";
import {Task} from "../../shared/subclass/Task";

Parse.Cloud.beforeSave("EventLog", (request, response) => {

    let eventLog = <EventLog>request.object;

    if (!eventLog.automatic) {
        eventLog.automatic = false;
    }

    response.success();


});

Parse.Cloud.afterSave("EventLog", (request) => {

    let EventLog = <EventLog>request.object;

    // wrieEventToSession(EventLog);
    return writeEventToReport(EventLog);


});


let writeEventToReport = async (eventLog: EventLog) => {

    let findReport = async (eventLog: EventLog) => {

        let reportQuery = new ReportQuery().matchingTask(task);

        if (eventLog.taskGroupStarted) {

            let taskGroupStarted = await eventLog.taskGroupStarted.fetch({useMasterKey: true});

            reportQuery.createdAfterObject(taskGroupStarted);
        }

        console.log('findReport', !!eventLog.taskGroupStarted);


        return reportQuery
            .build()
            .first({useMasterKey: true});
    };

    let writeEvent = async (report: Report, eventLog: EventLog) => {
        console.log('Writing event to report: ' + report.id);
        console.log('At client:  ' + report.get('clientAddress'));

        if (eventLog.get('eventCode') === 105) {
            report.set('extraTimeSpent', eventLog.get('amount'));
        }

        eventLog.set('reported', true);

        report.addUnique(Report._eventLogs, eventLog);

        if (eventLog.task) {
            report.addUnique(Report._tasks, eventLog.task);
        }

        report.increment('eventCount');

        return report.save(null, {useMasterKey: true});
    };

    let createReport = async (eventLog: EventLog) => {
        // let report = new Report();
        //
        // Object.keys(eventLog.attributes).forEach( (fieldName) => {
        //     report.set(fieldName, eventLog.get(fieldName));
        // });
        //
        // return report.save(null, { useMasterKey: true });

        let report: Report = await new Report().save(eventLog.attributes, {useMasterKey: true});

        await writeEvent(report, eventLog);
    };

    let task: Task = eventLog.task;

    if (task && !eventLog.get('reported')) {
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