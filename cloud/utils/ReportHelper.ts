import { Report, ReportQuery } from '../../shared/subclass/Report';
import { Task, TaskQuery, TaskType } from '../../shared/subclass/Task';
import * as _ from 'lodash';
import { TaskGroupStarted } from '../../shared/subclass/TaskGroupStarted';
import { TaskGroup } from '../../shared/subclass/TaskGroup';
import { Client } from '../../shared/subclass/Client';
import { EventLog, TaskEvent } from '../../shared/subclass/EventLog';
import moment = require('moment');

export class ReportHelper {

    public static async findReport(client: Client, task: Task, taskType: TaskType): Promise<Report> {
        let reportQuery = new ReportQuery().matchingClient(client);

        if (_.includes([TaskType.STATIC, TaskType.ALARM], taskType)) {
            // Simply write one report per task
            reportQuery.matchingTask(task);
        } else {
            // Append all task events to the same report
            const tasks: Task[] = await ReportHelper.getAllReportTask(client);
            const taskGroupPair = await ReportHelper.getFirstTaskGroupPairForTasks(tasks);

            // Look for existing report created after the first possible task group started
            reportQuery.createdAfterObject(taskGroupPair.taskGroupStarted);
        }

        return reportQuery.build().first({useMasterKey: true});
    }

    public static async getAllReportTask(client: Client): Promise<Task[]> {
        // Locate all tasks assigned to this client
        return new TaskQuery()
            .matchingClient(client)
            .notArchived()
            .isRunToday()
            .build()
            .find({useMasterKey: true});
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

    public static async getFirstTaskGroupPairForTasks(tasks: Task[]): Promise<{taskGroup: TaskGroup, taskGroupStarted: TaskGroupStarted}> {
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
        const firstTaskGroupStarted =  _.first(
            _.sortBy<TaskGroupStarted>(taskGroupsStartedRunToday, (taskGroupStarted) => taskGroupStarted.timeStarted)
        );

        return {
            taskGroupStarted: firstTaskGroupStarted,
            taskGroup: _.find<TaskGroup>(taskGroups, (taskGroup) => taskGroup.id === firstTaskGroupStarted.taskGroup.id)
        }
    }

    public static async closeIfLastTask(task: Task) {
        // const tasks: Task[] = await ReportHelper.getAllReportTask(task.client);
        // const firstTaskGroupStarted: TaskGroupStarted = await ReportHelper.getFirstTaskGroupPairForTasks(tasks);
        //
        // const taskGroupResetTime = moment(firstTaskGroupStarted.createdAt).day()
        // const sortedByTimeEnd = _.sortBy(tasks, (task) => {
        //
        // })
    }
}