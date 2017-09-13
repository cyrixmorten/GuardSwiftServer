"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TaskGroup_1 = require("../../shared/subclass/TaskGroup");
const TaskGroupStarted_1 = require("../../shared/subclass/TaskGroupStarted");
const Task_1 = require("../../shared/subclass/Task");
const _ = require("lodash");
const util = require("util");
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
            .find({ useMasterKey: true }).then((activeTaskGroupStarted) => {
            console.log('Resetting active groups: ', _.map(activeTaskGroupStarted, 'name'));
            _.forEach(activeTaskGroupStarted, (taskGroupStarted) => {
                taskGroupStarted.timeEnded = new Date();
            });
            return Parse.Object.saveAll(activeTaskGroupStarted, { useMasterKey: true }).then(() => {
                // Create new taskGroupStarted
                if (taskGroup.isRunToday()) {
                    taskGroup.createdDay = this.now_day;
                    let newTaskGroupStarted = new TaskGroupStarted_1.TaskGroupStarted();
                    newTaskGroupStarted.taskGroup = taskGroup;
                    newTaskGroupStarted.copyAttributes(taskGroup, ['name', 'owner', 'ACL']);
                    newTaskGroupStarted.timeEnded = undefined;
                    newTaskGroupStarted.timeStarted = new Date();
                    return Parse.Promise.when([
                        // Save day of creation to taskGroup
                        taskGroup.save(null, { useMasterKey: true }),
                        // Save new taskGroupStarted
                        newTaskGroupStarted.save(null, { useMasterKey: true })
                    ]);
                }
            });
        });
    }
    resetRegularTasksMatching(taskGroup) {
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
        let findTaskGroupStarted = () => {
            return new TaskGroupStarted_1.TaskGroupStartedQuery().matchingTaskGroup(taskGroup).notEnded().build()
                .first({ useMasterKey: true });
        };
        let findTasks = () => {
            return new Task_1.TaskQuery().matchingTaskGroup(taskGroup).build().limit(1000).find({ useMasterKey: true });
        };
        let resetTask = (task, taskGroupStarted) => {
            task.status = Task_1.TaskStatus.PENDING;
            task.guard = undefined;
            task.timesArrived = 0;
            task.isRunToday = taskGroup.isRunToday();
            task.taskGroupStarted = taskGroupStarted;
        };
        console.log(util.format('Resetting taskGroup: %s', taskGroup.name));
        let taskGroupStarted;
        return findTaskGroupStarted().then((foundTaskGroupStarted) => {
            if (foundTaskGroupStarted) {
                console.log(`Found taskGroupStarted: ${foundTaskGroupStarted.id}`);
            }
            taskGroupStarted = foundTaskGroupStarted;
            return findTasks();
        }).then((tasks) => {
            console.log(`Resetting ${tasks.length} tasks for taskGroup ${taskGroup.name}`);
            _.forEach(tasks, (task) => {
                resetTask(task, taskGroupStarted);
            });
            return Parse.Object.saveAll(tasks, { useMasterKey: true });
        }, (e) => {
            console.error(e);
            return e;
        });
    }
}
exports.ResetTasks = ResetTasks;
//# sourceMappingURL=ResetTasks.js.map