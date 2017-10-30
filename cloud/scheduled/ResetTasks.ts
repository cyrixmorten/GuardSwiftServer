import {TaskGroup} from "../../shared/subclass/TaskGroup";
import {TaskGroupStarted, TaskGroupStartedQuery} from "../../shared/subclass/TaskGroupStarted";
import {Task, TaskQuery} from "../../shared/subclass/Task";
import IPromise = Parse.IPromise;
import * as _ from "lodash";
import * as util from "util";
import "tslib";


export class ResetTasks {


    private now_day: number;
    private now_hours: number;

    constructor(private force?: boolean) {
        let now = new Date();

        this.now_day = now.getHours();
        this.now_day = now.getDay();
    }

    async run(): Promise<any> {

        // TODO skip after successful migration to 5.0
        await this.ensureMigrated();


        let queryTaskGroups = new Parse.Query(TaskGroup);
        if (!this.force) {
            queryTaskGroups.notEqualTo(TaskGroup._createdDay, this.now_day);
        }
        queryTaskGroups.doesNotExist(TaskGroup._archive);
        return queryTaskGroups.each((taskGroup: TaskGroup) => {

            console.log('------');
            console.log('Resetting TaskGroup: ', taskGroup.name);
            console.log('Is run today: ', taskGroup.isRunToday());
            console.log('Hours until reset: ', taskGroup.hoursUntilReset());

            if (this.force || taskGroup.resetNow()) {
                return this.resetTaskGroupsStartedMatching(taskGroup)
                    .then(() => this.resetRegularTasksMatching(taskGroup));
            }

        }, {useMasterKey: true})
    }

    // TODO remove when Circuit tasks are no longer being used
    private ensureMigrated(): PromiseLike<any> {
        return Parse.Cloud.run('MigrateAll');
    }

    private resetTaskGroupsStartedMatching(taskGroup: TaskGroup): IPromise<void> {
        return new TaskGroupStartedQuery()
            .matchingTaskGroup(taskGroup)
            .notEnded()
            .build()
            .find({useMasterKey: true}).then((activeTaskGroupStarted: TaskGroupStarted[]) => {

                console.log('Resetting active groups: ', _.map(activeTaskGroupStarted, 'name'));

                _.forEach<TaskGroupStarted[]>(activeTaskGroupStarted, (taskGroupStarted: TaskGroupStarted) => {
                    taskGroupStarted.timeEnded = new Date();
                });

                return Parse.Object.saveAll(activeTaskGroupStarted, {useMasterKey: true}).then(() => {

                    // Create new taskGroupStarted
                    if (taskGroup.isRunToday()) {

                        taskGroup.createdDay = this.now_day;

                        let newTaskGroupStarted = new TaskGroupStarted();
                        newTaskGroupStarted.taskGroup = taskGroup;
                        newTaskGroupStarted.copyAttributes(taskGroup, ['name', 'owner', 'ACL']);
                        newTaskGroupStarted.timeEnded = undefined;
                        newTaskGroupStarted.timeStarted = new Date();

                        return Parse.Promise.when([
                            // Save day of creation to taskGroup
                            taskGroup.save(null, {useMasterKey: true}),
                            // Save new taskGroupStarted
                            newTaskGroupStarted.save(null, {useMasterKey: true})
                        ]);
                    }
                });

            })
    }

    private resetRegularTasksMatching(taskGroup: TaskGroup): IPromise<Task[]> {

        // let arrivedQuery = new TaskQuery().matchingTaskStatus(TaskStatus.ARRIVED).build();
        // let abortedQuery = new TaskQuery().matchingTaskStatus(TaskStatus.ABORTED).build();
        // let finishedQuery = new TaskQuery().matchingTaskStatus(TaskStatus.FINISHED).build();
        // let timesArrivedQuery = new TaskQuery().whereTimesArrivedGreaterThan(0).build();
        //
        // let mainQuery = Parse.Query.or(arrivedQuery, abortedQuery, finishedQuery, timesArrivedQuery);
        // mainQuery.equalTo(Task._taskGroup, taskGroup);
        //
        // return mainQuery.each((task: Task) => {
        //
        //     console.log('Resetting task', task.clientName, task.name);
        //
        //     task.status = TaskStatus.PENDING;
        //     task.guard = undefined;
        //     task.timesArrived = 0;
        //
        //     return task.save(null, { useMasterKey: true } )
        // }, {useMasterKey: true})

        let findTaskGroupStarted = (): Parse.Promise<TaskGroupStarted> => {
            return new TaskGroupStartedQuery().matchingTaskGroup(taskGroup).notEnded().build()
                .first({useMasterKey: true});
        };

        let findTasks = (): Parse.Promise<Task[]> => {
            return new TaskQuery().matchingTaskGroup(taskGroup).build().limit(1000).find({useMasterKey: true})
        };

        console.log(util.format('Resetting taskGroup: %s', taskGroup.name));

        let taskGroupStarted: TaskGroupStarted;
        return findTaskGroupStarted().then((foundTaskGroupStarted: TaskGroupStarted) => {
            if (foundTaskGroupStarted) {
                console.log(`Found taskGroupStarted: ${foundTaskGroupStarted.id}`);
            }

            taskGroupStarted = foundTaskGroupStarted;

            return findTasks();
        }).then((tasks: Task[]) => {
            console.log(`Resetting ${tasks.length} tasks for taskGroup ${taskGroup.name}`);

            _.forEach(tasks, (task: Task) => {
                task.reset(taskGroup, taskGroupStarted);
            });

            return Parse.Object.saveAll(tasks, {useMasterKey: true});
        },(e) => {
            console.error(e);

            return e;
        })
    }

}