import {EventLog, TaskEvent} from "../../shared/subclass/EventLog";
import {Report, ReportQuery} from "../../shared/subclass/Report";
import {Task, TaskQuery, TaskType} from "../../shared/subclass/Task";
import * as moment from 'moment';
import * as _ from 'lodash';
import {TaskGroupStarted} from '../../shared/subclass/TaskGroupStarted';
import {QueryBuilder} from '../../shared/QueryBuilder';
import {BaseClass} from '../../shared/subclass/BaseClass';
import {TaskGroup} from '../../shared/subclass/TaskGroup';

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

            // 2) A unique list of all started task groups matching client tasks
            const taskGroupStartedPointers = _.compact(_.uniq(_.map(tasks, task => {
                return task.taskGroupStarted;
            })));
            const taskGroupsStarted: TaskGroupStarted[] = await Parse.Object.fetchAll(taskGroupStartedPointers, {useMasterKey: true});
            console.log('taskGroupsStarted', _.map(taskGroupsStarted, TaskGroupStarted._name));

            // 3) Investigate if any task groups are not run today
            const taskGroupPointers = _.map(taskGroupsStarted, TaskGroupStarted._taskGroup);
            const taskGroups: TaskGroup[] = await Parse.Object.fetchAll(taskGroupPointers, {useMasterKey: true});

            const taskGroupsRunToday = _.filter<TaskGroup>(taskGroups, (taskGroup) => taskGroup.isRunToday());
            console.log('taskGroupsRunToday', _.map(taskGroupsRunToday, TaskGroup._name));

            // 4) Only take those started task groups that run today into account
            const taskGroupsStartedRunToday = _.filter<TaskGroupStarted>(taskGroupsStarted, (taskGroupStarted: TaskGroupStarted) => {
                return _.some(taskGroupsRunToday, taskGroup => taskGroup.id === taskGroupStarted.taskGroup.id);
            });
            console.log('taskGroupsStartedRunToday', _.map(taskGroupsStartedRunToday, TaskGroupStarted._name));

            // 5) Select the task group started that was created the earliest
            const firstTaskGroupStarted = _.first(
                _.sortBy<TaskGroupStarted>(taskGroupsStartedRunToday, (taskGroupStarted) => taskGroupStarted.timeStarted)
            );

            /*
             * Compare to how it used to be
             * TODO: Remove
             */
            let taskGroupStarted = await eventLog.taskGroupStarted.fetch({useMasterKey: true});
            console.log('Previous search time', _.pick(taskGroupStarted, TaskGroupStarted._name), moment(taskGroupStarted.createdAt).format('DD-MM HH:mm'));
            console.log('Current search time', _.pick(firstTaskGroupStarted, TaskGroupStarted._name), moment(firstTaskGroupStarted.timeStarted).format('DD-MM HH:mm'));
            // TODO: Remove

            // 6) Look for existing report created after the first possible task group started
            reportQuery.createdAfterObject(firstTaskGroupStarted);
        }

        return reportQuery
            .build()
            .first({useMasterKey: true});
    };

    let writeEvent = async (report: Report, eventLog: EventLog) => {
        console.log('Writing event to report: ' + report.id);
        console.log('At client:  ' + report.clientFullAddress);

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
        let report: Report;
        try {
            report = await findReport(eventLog);
        } catch (e) {
            console.error('Error while finding report:');
            console.error(e);
        }

        if (report) {
            try {
                await writeEvent(report, eventLog);
            } catch (e) {
                console.error('Error while writing event to report:');
                console.error(e);
            }
        } else {
            try {
                await createReport(eventLog);
            } catch (e) {
                console.error('Error while creating report:');
                console.error(e);
            }
        }


    } else if (task) {
        console.log('Already written to report');
    } else {
        console.log('Not a report event');
    }

};