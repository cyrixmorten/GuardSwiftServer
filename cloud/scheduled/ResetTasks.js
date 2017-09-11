"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TaskGroup_1 = require("../../shared/subclass/TaskGroup");
const TaskGroupStarted_1 = require("../../shared/subclass/TaskGroupStarted");
const Task_1 = require("../../shared/subclass/Task");
class ResetTasks {
    constructor(force) {
        this.force = force;
        let now = new Date();
        this.now_day = now.getHours();
        this.now_day = now.getDay();
    }
    run() {
        return this.ensureMigrated().then(() => {
            let queryTaskGroups = new Parse.Query(TaskGroup_1.TaskGroup);
            if (!this.force) {
                queryTaskGroups.notEqualTo(TaskGroup_1.TaskGroup._createdDay, this.now_day);
            }
            queryTaskGroups.doesNotExist(TaskGroup_1.TaskGroup._archive);
            return queryTaskGroups.each((taskGroup) => {
                console.log('------');
                console.log('Resetting TaskGroup: ', taskGroup.name);
                console.log('Is run today: ', taskGroup.isRunToday());
                console.log('Hours until reset: ', taskGroup.hoursUntilReset());
                if (this.force || taskGroup.resetNow()) {
                    return this.resetTaskGroupsStartedMatching(taskGroup)
                        .then(() => this.resetRegularTasksMatching(taskGroup));
                }
            }, { useMasterKey: true });
        });
    }
    // TODO remove when Circuit tasks are no longer being used
    ensureMigrated() {
        return Parse.Cloud.run('MigrateAll');
    }
    resetTaskGroupsStartedMatching(taskGroup) {
        return new TaskGroupStarted_1.TaskGroupStartedQuery()
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
                let newTaskGroupStarted = new TaskGroupStarted_1.TaskGroupStarted();
                newTaskGroupStarted.copyAttributes(taskGroupStarted);
                newTaskGroupStarted.timeEnded = undefined;
                newTaskGroupStarted.timeStarted = new Date();
                promises.push([
                    taskGroup.save(null, { useMasterKey: true }),
                    newTaskGroupStarted.save(null, { useMasterKey: true })
                ]);
            }
            return Parse.Promise.when(promises);
        }, { useMasterKey: true });
    }
    resetRegularTasksMatching(taskGroup) {
        let arrivedQuery = new Task_1.TaskQuery().matchingTaskStatus(Task_1.TaskStatus.ARRIVED).build();
        let abortedQuery = new Task_1.TaskQuery().matchingTaskStatus(Task_1.TaskStatus.ABORTED).build();
        let finishedQuery = new Task_1.TaskQuery().matchingTaskStatus(Task_1.TaskStatus.FINISHED).build();
        let timesArrivedQuery = new Task_1.TaskQuery().whereTimesArrivedGreaterThan(0).build();
        let mainQuery = Parse.Query.or(arrivedQuery, abortedQuery, finishedQuery, timesArrivedQuery);
        mainQuery.equalTo(Task_1.Task._taskGroup, taskGroup);
        return mainQuery.each((task) => {
            console.log('Resetting task', task.clientName, task.name);
            task.status = Task_1.TaskStatus.PENDING;
            task.guard = undefined;
            task.timesArrived = 0;
            return task.save(null, { useMasterKey: true });
        }, { useMasterKey: true });
    }
}
exports.ResetTasks = ResetTasks;
//# sourceMappingURL=ResetTasks.js.map