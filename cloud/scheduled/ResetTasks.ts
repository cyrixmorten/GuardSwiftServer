import {TaskGroup} from "../../shared/subclass/TaskGroup";
import {TaskGroupStarted, TaskGroupStartedQuery} from "../../shared/subclass/TaskGroupStarted";
import {Task, TaskQuery, TaskStatus} from "../../shared/subclass/Task";
import * as rp from "request-promise";
import * as _ from "lodash";

export class ResetTasks {


    private now_day: number;
    private now_hours: number;

    constructor(private force?: boolean) {
        let now = new Date();

        this.now_day = now.getHours();
        this.now_day = now.getDay();
    }

    public run(): PromiseLike<any> {
        return this.ensureMigrated().then(() => {

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
        });
    }

    // TODO remove when Circuit tasks are no longer being used
    private ensureMigrated(): PromiseLike<void> {
        return Parse.Cloud.run('MigrateAll')
    }

    private resetTaskGroupsStartedMatching(taskGroup: TaskGroup): Parse.Promise<void> {
        return new TaskGroupStartedQuery()
            .matchingTaskGroup(taskGroup)
            .notEnded()
            .build()
            .each((taskGroupStarted) => {
                // finish matching
                taskGroupStarted.timeEnded = new Date();

                console.log('Reseting group started: ', taskGroupStarted.name);

                let promises = [
                    taskGroupStarted.save(null, { useMasterKey: true })
                ];

                if (taskGroup.isRunToday()) {

                    taskGroup.createdDay = this.now_hours;

                    let newTaskGroupStarted = new TaskGroupStarted();
                    newTaskGroupStarted.copyAttributes(taskGroupStarted);
                    newTaskGroupStarted.timeEnded = undefined;
                    newTaskGroupStarted.timeStarted = new Date();

                    promises.push([
                        taskGroup.save(null, { useMasterKey: true }),
                        newTaskGroupStarted.save(null, { useMasterKey: true })
                    ])
                }

                return Parse.Promise.when(promises);

            }, {useMasterKey: true})
    }

    private resetRegularTasksMatching(taskGroup: TaskGroup): Parse.Promise<void> {

        let arrivedQuery = new TaskQuery().matchingTaskStatus(TaskStatus.ARRIVED).build();
        let abortedQuery = new TaskQuery().matchingTaskStatus(TaskStatus.ABORTED).build();
        let finishedQuery = new TaskQuery().matchingTaskStatus(TaskStatus.FINISHED).build();
        let timesArrivedQuery = new TaskQuery().whereTimesArrivedGreaterThan(0).build();

        let mainQuery = Parse.Query.or(arrivedQuery, abortedQuery, finishedQuery, timesArrivedQuery);
        mainQuery.equalTo(Task._taskGroup, taskGroup);

        return mainQuery.each((task: Task) => {

            console.log('Resetting task', task.clientName, task.name);

            task.status = TaskStatus.PENDING;
            task.guard = undefined;
            task.timesArrived = 0;

            return task.save(null, { useMasterKey: true } )
        }, {useMasterKey: true})

    }

}