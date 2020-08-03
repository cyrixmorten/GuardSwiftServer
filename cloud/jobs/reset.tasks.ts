import { TaskGroup, TaskGroupQuery } from "../../shared/subclass/TaskGroup";
import { TaskGroupStarted, TaskGroupStartedQuery } from '../../shared/subclass/TaskGroupStarted';
import { Task, TaskQuery } from "../../shared/subclass/Task";
import * as _ from "lodash";
import * as util from "util";
import { User, UserQuery } from "../../shared/subclass/User";
import { ReportQuery } from '../../shared/subclass/Report';
import moment = require('moment');
import { ReportHelper } from '../utils/ReportHelper';
import { SendReports } from './send.reports';

export interface IResetOptions {
    force: boolean;
    fakeDate: Date;
    taskGroupId: string;
}

/**
 * This task is run daily to create new TaskGroupStarted entries and reset the tasks within
 */
export class ResetTasks {

    private resetDate: Date;

    constructor(private options: Partial<IResetOptions>) {
        this.resetDate = this.options.fakeDate ?? new Date();
    }


    async run(): Promise<any> {
        return new UserQuery().isActive().build().each(async (user: User) => {

            const timeZone = user.get(User._timeZone);

            await new TaskGroupQuery().matchingOwner(user).matchingId(this.options.taskGroupId).build()
                .each(async (taskGroup: TaskGroup) => {

                    try {
                        return this.runForTaskGroup(user, taskGroup, timeZone);
                    } catch(e) {
                        console.error("Error restting taskgroup", e);
                    }

                }, {useMasterKey: true});

        }, {useMasterKey: true});


    }

    private async runForTaskGroup(user: User, taskGroup: TaskGroup, timeZone: string) {
        const alreadyReset = taskGroup.getResetDay() === this.resetDate.getDay();

        const performReset = this.options.force || (!alreadyReset && taskGroup.resetNow(timeZone));

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


            for (const taskGroupStarted of endedTaskGroups) {
                // close reports matching ended task group
                const reports = await new ReportQuery().matchingTaskGroupStarted(taskGroupStarted).notClosed().build().find({useMasterKey: true});
                await Parse.Object.saveAll(_.map(reports, ReportHelper.closeReport), {useMasterKey: true});

                // send out reports for closed task group
                await new SendReports().sendTaskGroupStartedReports(taskGroupStarted);
            }
        }
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
        taskGroup.resetDate = moment(this.resetDate).hour(taskGroup.timeResetDate.getHours()).minutes(taskGroup.timeResetDate.getMinutes()).toDate();
        taskGroup.createdDay = this.resetDate.getDay();
        // Save day of creation to taskGroup
        await taskGroup.save(null, {useMasterKey: true});
    }

    private async createNewTaskGroupStarted(taskGroup: TaskGroup): Promise<TaskGroupStarted> {

        let newTaskGroupStarted = new TaskGroupStarted();
        newTaskGroupStarted.taskGroup = taskGroup;
        
        newTaskGroupStarted.copyAttributes<TaskGroupStarted>(taskGroup, TaskGroup._name, TaskGroup._owner, TaskGroup._resetDate, TaskGroup._ACL);
        newTaskGroupStarted.timeEnded = undefined;
        newTaskGroupStarted.timeStarted = new Date();
        console.log("NEXT")

        return await newTaskGroupStarted.save(null, {useMasterKey: true});
    }


    private async resetTasksMatchingGroup(owner: User, taskGroup: TaskGroup, taskGroupStarted: TaskGroupStarted): Promise<Task[]> {
        console.log(util.format('Resetting taskGroup: %s', taskGroup.name));

        const tasks = await new TaskQuery().matchingTaskGroup(taskGroup).build().limit(Number.MAX_SAFE_INTEGER).find({useMasterKey: true});

        return Parse.Object.saveAll(_.map<Task, Task>(tasks,
            (task: Task) => task.dailyReset(this.resetDate, owner, taskGroup, taskGroupStarted, ...tasks)), {useMasterKey: true});
    }

}