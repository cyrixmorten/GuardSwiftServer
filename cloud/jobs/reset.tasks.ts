import {TaskGroup} from "../../shared/subclass/TaskGroup";
import {TaskGroupStarted, TaskGroupStartedQuery} from "../../shared/subclass/TaskGroupStarted";
import {Task, TaskQuery} from "../../shared/subclass/Task";
import * as _ from "lodash";
import * as util from "util";
import "tslib";
import {User} from "../../shared/subclass/User";
import {ReportQuery} from '../../shared/subclass/Report';


export class ResetTasks {


    private now_day: number;

    constructor(private force?: boolean) {
        let now = new Date();

        this.now_day = now.getDay();
    }

    async run(): Promise<any> {
        let query = new Parse.Query(Parse.User);
        query.equalTo(User._active, true);

        return query.each((user) => {

            let queryTaskGroups = new Parse.Query(TaskGroup);
            if (!this.force) {
                queryTaskGroups.notEqualTo(TaskGroup._createdDay, this.now_day);
            }
            queryTaskGroups.doesNotExist(TaskGroup._archive);
            queryTaskGroups.equalTo(TaskGroup._owner, user);
            return queryTaskGroups.each(async (taskGroup: TaskGroup) => {

                console.log('Resetting TaskGroup: ', taskGroup.name,
                    'Is run today: ', taskGroup.isRunToday(),
                    'Hours until reset: ', taskGroup.hoursUntilReset(),
                    'Perform reset: ', taskGroup.resetNow());

                if (this.force || taskGroup.resetNow()) {
                    return Promise.all([
                        this.endTaskGroupsStartedAndCloseReports(taskGroup),
                        this.createNewTaskGroupStarted(taskGroup),
                        this.resetTasksMatchingGroup(taskGroup)
                    ]);
                }

            }, {useMasterKey: true});

        }, {useMasterKey: true});


    }


    private async endTaskGroupsStartedAndCloseReports(taskGroup: TaskGroup): Promise<void> {

        const activeTaskGroupsStarted: TaskGroupStarted[] = await new TaskGroupStartedQuery()
            .matchingTaskGroup(taskGroup)
            .notEnded()
            .build()
            .find({useMasterKey: true});

        console.log('Resetting active groups: ', _.map(activeTaskGroupsStarted, 'name'));

        // mark started task groups as ended
        await Parse.Object.saveAll(_.map<TaskGroupStarted, TaskGroupStarted>(activeTaskGroupsStarted, (taskGroupStarted) => {
            taskGroupStarted.timeEnded = new Date();
            return taskGroupStarted;
        }), {useMasterKey: true});


        // close reports matching task group started
        _.forEach(activeTaskGroupsStarted, async (taskGroupStarted) => {
            const reports = await new ReportQuery().matchingTaskGroupStarted(taskGroupStarted).build().find({useMasterKey: true});

            await Parse.Object.saveAll(_.map(reports, (report) => {
                report.isClosed = true;
                return report;
            }), {useMasterKey: true});
        });
    }

    private async createNewTaskGroupStarted(taskGroup: TaskGroup): Promise<void> {
        if (taskGroup.isRunToday()) {

            taskGroup.createdDay = this.now_day;
            // Save day of creation to taskGroup
            await taskGroup.save(null, {useMasterKey: true});

            let newTaskGroupStarted = new TaskGroupStarted();
            newTaskGroupStarted.taskGroup = taskGroup;
            newTaskGroupStarted.copyAttributes<TaskGroupStarted>(taskGroup, TaskGroupStarted._name, TaskGroupStarted._owner, TaskGroupStarted.ACL);
            newTaskGroupStarted.timeEnded = undefined;
            newTaskGroupStarted.timeStarted = new Date();


            await newTaskGroupStarted.save(null, {useMasterKey: true});
        }
    }



    private async resetTasksMatchingGroup(taskGroup: TaskGroup): Promise<Task[]> {
        if (!taskGroup) {
            return;
        }

        console.log(util.format('Resetting taskGroup: %s', taskGroup.name));

        const taskGroupStarted: TaskGroupStarted = await new TaskGroupStartedQuery().activeMatchingTaskGroup(taskGroup).build().first({useMasterKey: true});

        // TODO: hard limit of 1000 tasks per group
        const tasks = await new TaskQuery().matchingTaskGroup(taskGroup).build().limit(1000).find({useMasterKey: true});

        return Parse.Object.saveAll(_.map<Task, Task>(tasks,
            (task) => task.reset(taskGroup, taskGroupStarted)), {useMasterKey: true});
    }

}