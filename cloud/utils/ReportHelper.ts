import { Report, ReportQuery } from '../../shared/subclass/Report';
import { Task, TaskQueries, TaskQuery, TaskType } from '../../shared/subclass/Task';
import * as _ from 'lodash';
import { TaskGroupStarted } from '../../shared/subclass/TaskGroupStarted';
import { TaskGroup } from '../../shared/subclass/TaskGroup';
import { Client } from '../../shared/subclass/Client';
import { EventLog, TaskEvent } from '../../shared/subclass/EventLog';

export class ReportHelper {

    public static async findReport(client: Client, task: Task, taskType: TaskType): Promise<Report> {
        let reportQuery = new ReportQuery().matchingClient(client);

        if (_.includes([TaskType.STATIC, TaskType.ALARM], taskType)) {
            // Simply write one report per task
            reportQuery.matchingTask(task);
        } else {
            // Append all task events to the same report
            const tasks: Task[] = await TaskQueries.getAllRunTodayMatchingClient(client);
            const taskGroupStarted: TaskGroupStarted = await ReportHelper.getFirstTaskStarted(tasks);

            // Look for existing report created after the first possible task group started
            reportQuery.createdAfterObject(taskGroupStarted);
        }

        return reportQuery.build().first({useMasterKey: true});
    }



    public static async writeEvent(report: Report, eventLog: EventLog) {
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

    public static async createReport(eventLog: EventLog) {

        let report: Report = await new Report().save(eventLog.attributes, {useMasterKey: true});

        await ReportHelper.writeEvent(report, eventLog);
    };

    public static async writeEventToReport(eventLog: EventLog) {

        let task: Task = eventLog.task;

        if (task && !eventLog.reported) {
            let report: Report;
            try {
                report = await ReportHelper.findReport(eventLog.client, eventLog.task, eventLog.taskType);
            } catch (e) {
                console.error('Error while finding report:');
                console.error(e);
            }

            if (report) {
                try {
                    await ReportHelper.writeEvent(report, eventLog);
                } catch (e) {
                    console.error('Error while writing event to report:');
                    console.error(e);
                }
            } else {
                try {
                    await ReportHelper.createReport(eventLog);
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

    public static async getFirstTaskStarted(tasks: Task[]): Promise<TaskGroupStarted> {
        // A unique list of all started task groups matching client tasks
        const taskGroupStartedPointers = _.compact(_.uniq(_.map(tasks, task => {
            return task.taskGroupStarted;
        })));
        const taskGroupsStarted: TaskGroupStarted[] = await Parse.Object.fetchAll(taskGroupStartedPointers, {useMasterKey: true});

        // Investigate if any task groups are not run today
        const taskGroupPointers = _.map(taskGroupsStarted, TaskGroupStarted._taskGroup);
        const taskGroups: TaskGroup[] = await Parse.Object.fetchAll(taskGroupPointers, {useMasterKey: true});

        const taskGroupsRunToday = _.filter<TaskGroup>(taskGroups, (taskGroup) => taskGroup.isRunToday());

        // Only take those started task groups that run today into account
        const taskGroupsStartedRunToday = _.filter<TaskGroupStarted>(taskGroupsStarted, (taskGroupStarted: TaskGroupStarted) => {
            return _.some(taskGroupsRunToday, taskGroup => taskGroup.id === taskGroupStarted.taskGroup.id);
        });

        // Select the task group started that was created the earliest
        return _.head(
            _.sortBy<TaskGroupStarted>(taskGroupsStartedRunToday, (taskGroupStarted) => taskGroupStarted.timeStarted)
        );
    }

    public static async closeReportIfLastTask(task: Task) {
        const tasks: Task[] = await TaskQueries.getAllRunTodayMatchingClient(task.client);

        const byDateAsc: Task[] = _.sortBy(tasks, (t: Task) => t.endDate);

        console.log('byDateAsc', byDateAsc);

        if (_.isEqual(task, _.last(byDateAsc))) {
            const report = await ReportHelper.findReport(task.client, task, task.taskType);

            ReportHelper.closeReport(report);

            await report.save(null, {useMasterKey: true})
        }
    }

    public static closeReport(report: Report): Report {
        if (!report) {
            return;
        }

        console.log('Closing report!', report.clientName);

        report.isClosed = true;
        return report
    }
}