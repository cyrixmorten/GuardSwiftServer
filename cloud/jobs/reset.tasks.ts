import { TaskGroup } from "../../shared/subclass/TaskGroup";
import { TaskGroupStarted, TaskGroupStartedQuery } from "../../shared/subclass/TaskGroupStarted";
import { Task, TaskQuery, TaskType } from "../../shared/subclass/Task";
import * as _ from "lodash";
import * as util from "util";
import "tslib";
import { User } from "../../shared/subclass/User";
import { Report, ReportQuery } from '../../shared/subclass/Report';
import { SendReports } from './send.reports';
import moment = require('moment');
import { ReportHelper } from '../utils/ReportHelper';

/**
 * This task is run daily to create new TaskGroupStarted entries and reset the tasks within
 */
export class ResetTasks {

    private now_day: number;

    constructor(private force?: boolean, private taskGroupId?: string) {
        this.now_day = new Date().getDay();
    }

    private taskGroupsMatchingUser(user: Parse.User) {
        let queryTaskGroups = new Parse.Query(TaskGroup);
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

        return query.each(async (user: Parse.User) => {

            const timeZone = user.get(User._timeZone);

            await this.taskGroupsMatchingUser(user).each(async (taskGroup: TaskGroup) => {

                const alreadyReset = taskGroup.getResetDay() === this.now_day;

                const performReset = this.force || (!alreadyReset && taskGroup.resetNow(timeZone));

                console.log('Resetting TaskGroup: ', taskGroup.name,
                    'Is run today: ', taskGroup.isRunToday(),
                    'Already reset today:', alreadyReset,
                    'Hours until reset: ', taskGroup.hoursUntilReset(timeZone),
                    'Perform reset: ', performReset);

                if (performReset) {

                    // set reset date on task group
                    await this.resetTaskGroup(taskGroup);

                    // end task group started objects matching taskgroup
                    const endedTaskGroups: TaskGroupStarted[] = await this.endTaskGroupsStarted(taskGroup);

                    // create new task group started if run today
                    const newTaskGroupStarted = taskGroup.isRunToday() ? await this.createNewTaskGroupStarted(taskGroup) : undefined;

                    // reset all tasks matching task group
                    await this.resetTasksMatchingGroup(user, taskGroup, newTaskGroupStarted);


                    // close reports matching ended task groups that are still open
                    _.forEach(endedTaskGroups, async (taskGroupStarted) => {
                        const reports = await new ReportQuery().matchingTaskGroupStarted(taskGroupStarted).notClosed().build().find({useMasterKey: true});

                        await Parse.Object.saveAll(_.map(reports, ReportHelper.closeReport), {useMasterKey: true});
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

    private async resetTaskGroup(taskGroup: TaskGroup) {
        taskGroup.resetDate = moment().hour(taskGroup.timeResetDate.getHours()).minutes(taskGroup.timeResetDate.getMinutes()).toDate();
        taskGroup.createdDay = this.now_day;
        // Save day of creation to taskGroup
        await taskGroup.save(null, {useMasterKey: true});
    }

    private async createNewTaskGroupStarted(taskGroup: TaskGroup): Promise<TaskGroupStarted> {

        let newTaskGroupStarted = new TaskGroupStarted();
        newTaskGroupStarted.taskGroup = taskGroup;
        newTaskGroupStarted.copyAttributes<TaskGroupStarted>(taskGroup, TaskGroupStarted._name, TaskGroupStarted._owner, TaskGroupStarted._ACL);
        newTaskGroupStarted.timeEnded = undefined;
        newTaskGroupStarted.timeStarted = new Date();


        return await newTaskGroupStarted.save(null, {useMasterKey: true});
    }


    private async resetTasksMatchingGroup(owner: Parse.User, taskGroup: TaskGroup, taskGroupStarted: TaskGroupStarted): Promise<Task[]> {
        console.log(util.format('Resetting taskGroup: %s', taskGroup.name));

        const tasks = await new TaskQuery().matchingTaskGroup(taskGroup).build().limit(9999).find({useMasterKey: true});

        return Parse.Object.saveAll(_.map<Task, Task>(tasks,
            (task: Task) => task.dailyReset(owner, taskGroup, taskGroupStarted)), {useMasterKey: true});
    }

}