import { TaskGroup } from "../../shared/subclass/TaskGroup";
import { TaskGroupStarted, TaskGroupStartedQuery } from "../../shared/subclass/TaskGroupStarted";
import { Task, TaskQuery, TaskType } from "../../shared/subclass/Task";
import * as _ from "lodash";
import * as util from "util";
import "tslib";
import { User } from "../../shared/subclass/User";
import { ReportQuery } from '../../shared/subclass/Report';
import { SendReports } from './send.reports';
import moment = require('moment');

/**
 * This task is run daily to create new TaskGroupStarted entries and reset the tasks within
 */
export class ResetTasks {

    private now_day: number;

    constructor(private force?: boolean, private taskGroupId?: string) {
        let now = new Date();

        this.now_day = now.getDay();
    }

    private taskGroupsMatchingDayAndUser(dayOfWeek: number, user: Parse.User) {
        let queryTaskGroups = new Parse.Query(TaskGroup);
        if (!this.force) {
            queryTaskGroups.notEqualTo(TaskGroup._createdDay, dayOfWeek);
        }
        if (this.taskGroupId) {
            console.log('Targeting taskGroup:', this.taskGroupId);
            queryTaskGroups.equalTo(TaskGroup._objectId, this.taskGroupId);
        }
        queryTaskGroups.doesNotExist(TaskGroup._archive);
        queryTaskGroups.equalTo(TaskGroup._owner, user);

        return queryTaskGroups;
    }

    async run(): Promise<any> {
        let query = new Parse.Query(Parse.User);
        query.equalTo(User._active, true);

        return query.each(async (user) => {


            await this.taskGroupsMatchingDayAndUser(this.now_day, user).each(async (taskGroup: TaskGroup) => {

                console.log('Resetting TaskGroup: ', taskGroup.name,
                    'Is run today: ', taskGroup.isRunToday(),
                    'Hours until reset: ', taskGroup.hoursUntilReset(),
                    'Perform reset: ', taskGroup.resetNow());

                if (this.force || taskGroup.resetNow()) {

                    // end task group started objects matching taskgroup
                    const endedTaskGroups: TaskGroupStarted[] = await this.endTaskGroupsStarted(taskGroup);

                    if (taskGroup.isRunToday()) {
                        // create new task group started and reset all tasks in it
                        await this.resetTasksMatchingGroup(user, taskGroup,
                            await this.createNewTaskGroupStarted(taskGroup)
                        );
                    }

                    // close reports matching ended task groups
                    _.forEach(endedTaskGroups, async (taskGroupStarted) => {
                        const reports = await new ReportQuery().matchingTaskGroupStarted(taskGroupStarted).build().find({useMasterKey: true});

                        await Parse.Object.saveAll(_.map(reports, (report) => {
                            report.isClosed = true;
                            return report;
                        }), {useMasterKey: true});
                    });

                    // send out all reports that have been closed
                    await new SendReports().sendAllMatchingTaskTypes(user,
                        moment().subtract(2, 'days').toDate(), new Date(),
                        [TaskType.REGULAR, TaskType.RAID]);

                }

            }, {useMasterKey: true});

        }, {useMasterKey: true});


    }


    private async endTaskGroupsStarted(taskGroup: TaskGroup): Promise<TaskGroupStarted[]> {

        const activeTaskGroupsStarted: TaskGroupStarted[] = await new TaskGroupStartedQuery()
            .matchingTaskGroup(taskGroup)
            .notEnded()
            .build()
            .find({useMasterKey: true});

        console.log('Resetting active groups: ', _.map(activeTaskGroupsStarted, 'name'));

        // mark started task groups as ended
        return Parse.Object.saveAll(_.map<TaskGroupStarted, TaskGroupStarted>(activeTaskGroupsStarted, (taskGroupStarted) => {
            taskGroupStarted.timeEnded = new Date();
            return taskGroupStarted;
        }), {useMasterKey: true});

    }

    private async createNewTaskGroupStarted(taskGroup: TaskGroup): Promise<TaskGroupStarted> {
        taskGroup.timeResetDate = moment().hour(taskGroup.timeResetDate.getUTCHours()).minutes(taskGroup.timeResetDate.getUTCMinutes()).toDate();
        taskGroup.createdDay = this.now_day;
        // Save day of creation to taskGroup
        await taskGroup.save(null, {useMasterKey: true});

        let newTaskGroupStarted = new TaskGroupStarted();
        newTaskGroupStarted.taskGroup = taskGroup;
        newTaskGroupStarted.copyAttributes<TaskGroupStarted>(taskGroup, TaskGroupStarted._name, TaskGroupStarted._owner, TaskGroupStarted._ACL);
        newTaskGroupStarted.timeEnded = undefined;
        newTaskGroupStarted.timeStarted = new Date();


        return await newTaskGroupStarted.save(null, {useMasterKey: true});
    }


    private async resetTasksMatchingGroup(owner: Parse.User, taskGroup: TaskGroup, taskGroupStarted: TaskGroupStarted): Promise<Task[]> {
        console.log(util.format('Resetting taskGroup: %s', taskGroup.name));

        // TODO: hard limit of 1000 tasks per group
        const tasks = await new TaskQuery().matchingTaskGroup(taskGroup).notArchived().build().limit(1000).find({useMasterKey: true});

        return Parse.Object.saveAll(_.map<Task, Task>(tasks,
            (task: Task) => task.dailyReset(owner, taskGroup, taskGroupStarted)), {useMasterKey: true});
    }

}