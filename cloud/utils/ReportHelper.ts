import { Report, ReportQuery } from '../../shared/subclass/Report';
import { Task, TaskQueries, TaskQuery, TaskType } from '../../shared/subclass/Task';
import * as _ from 'lodash';
import { TaskGroupStarted } from '../../shared/subclass/TaskGroupStarted';
import { TaskGroup } from '../../shared/subclass/TaskGroup';
import { Client } from '../../shared/subclass/Client';
import { EventLog, TaskEvent } from '../../shared/subclass/EventLog';
import * as moment from 'moment';

export class ReportHelper {

    public static async getFirstAndLastTaskGroupStarted(client) {
        const taskGroupsStarted: TaskGroupStarted[] = await ReportHelper.getSortedTaskGroupsStarted(client);

        return {
            first: _.head(taskGroupsStarted),
            last: _.head(_.reverse(taskGroupsStarted))
        }
    }

    public static async findActiveReport(client: Client, task: Task, taskType: TaskType): Promise<Report> {
        let reportQuery = new ReportQuery()
            .isSent(false)
            .matchingClient(client);

        if (_.includes([TaskType.REGULAR, TaskType.RAID], taskType)) {
            // Append all task events to the same report
            const activeTaskGroupsStarted = await ReportHelper.getFirstAndLastTaskGroupStarted(client);

            // Look for existing report created after the first possible task group started
            reportQuery.createdAfterObject(activeTaskGroupsStarted.first);

            if (activeTaskGroupsStarted.last.timeEnded) {
                reportQuery.lessThan(Report._createdAt, activeTaskGroupsStarted.last.timeEnded);
            }
        } else {
            // Simply write one report per task
            reportQuery.matchingTask(task);
        }

        return reportQuery.build().first({useMasterKey: true});
    }



    public static async writeEvent(report: Report, eventLog: EventLog) {
        console.log('Writing event to report: ' + report.id);
        console.log('At client:  ' + report.clientFullAddress);

        if (eventLog.eventCode === 105) {
            report.set('extraTimeSpent', eventLog.amount);
        }

        eventLog.report = report;

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
        if (!eventLog.task || eventLog.report) {
            return;
        }

        if (eventLog.matchingTaskEvent(TaskEvent.ACCEPT, TaskEvent.ARRIVE, TaskEvent.OTHER)) {
            try {
                const report = await ReportHelper.findActiveReport(eventLog.client, eventLog.task, eventLog.taskType);
                if (!report) {
                    await ReportHelper.createReport(eventLog);
                } else {
                    await ReportHelper.writeEvent(report, eventLog);
                }
            } catch (e) {
                console.error('Error writing event to report: ', e);
            }
        }
    };

    /**
     * 
     * Return all 
     * 
     * @param tasks
     * @returns TaskGroupStarted[] 
     */
    private static async getSortedTaskGroupsStarted(client: Client): Promise<TaskGroupStarted[]> {

        const tasks: Task[] = await TaskQueries.getAllRunTodayMatchingClient(client);

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

        return _.sortBy<TaskGroupStarted>(taskGroupsStartedRunToday, (taskGroupStarted) => taskGroupStarted.timeStarted);
    }

    public static async closeReportIfLastTask(task: Task) {
        const tasks: Task[] = await TaskQueries.getAllRunTodayMatchingClient(task.client);

        const lastPlannedTask = _.last(_.sortBy(tasks, (t: Task) => t.endDate));

        if (_.isEqual(task.id, lastPlannedTask.id)) {
            const report = await ReportHelper.findActiveReport(task.client, task, task.taskType);

            ReportHelper.closeReport(report);

            await report.save(null, {useMasterKey: true})
        }
    }

    public static closeReport(report: Report): Report {
        if (!report) {
            return;
        }

        report.isClosed = true;
        
        return report
    }

    public static async tasksMatchingReport(report: Report, ...includes: Array<keyof Task>): Promise<Task[]> {
        const client: Client = await report.client.fetch({useMasterKey: true});

        const taskTypes = report.isMatchingTaskType(TaskType.REGULAR, TaskType.RAID) ? [TaskType.REGULAR, TaskType.RAID] : [];

        const taskQueries = taskTypes.map(taskType => {
            return new TaskQuery()
                .matchingClient(client)
                .include(...includes)
                .matchingTaskType(taskType)
                .build();
        });

        const allTasksMatchingClient = await Promise.all(taskQueries.map(taskQuery => taskQuery.find({useMasterKey: true})));
        

        return _.flatten(allTasksMatchingClient);
    }
}