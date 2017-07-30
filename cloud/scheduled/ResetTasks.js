"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TaskGroup_1 = require("../../shared/subclass/TaskGroup");
var TaskGroupStarted_1 = require("../../shared/subclass/TaskGroupStarted");
var Task_1 = require("../../shared/subclass/Task");
var rp = require("request-promise");
var ResetTasks = (function () {
    function ResetTasks(force) {
        this.force = force;
        var now = new Date();
        this.now_day = now.getHours();
        this.now_day = now.getDay();
    }
    ResetTasks.prototype.run = function () {
        var _this = this;
        return this.ensureMigrated().then(function () {
            var queryTaskGroups = new Parse.Query(TaskGroup_1.TaskGroup);
            if (!_this.force) {
                queryTaskGroups.notEqualTo(TaskGroup_1.TaskGroup._createdDay, _this.now_day);
            }
            queryTaskGroups.doesNotExist(TaskGroup_1.TaskGroup._archive);
            return queryTaskGroups.each(function (taskGroup) {
                console.log('------');
                console.log('Reseting TaskGroup: ', taskGroup.name);
                console.log('Is run today: ', taskGroup.isRunToday());
                console.log('Hours until reset: ', taskGroup.hoursUntilReset());
                if (_this.force || taskGroup.resetNow()) {
                    return _this.resetTaskGroupsStartedMatching(taskGroup)
                        .then(function () { return _this.resetRegularTasksMatching(taskGroup); });
                }
            }, { useMasterKey: true });
        });
    };
    // TODO remove when Circuit tasks are no longer being used
    ResetTasks.prototype.ensureMigrated = function () {
        var options = {
            headers: {
                'X-Parse-Application-Id': process.env.APP_ID,
                'X-Parse-Master-Key': process.env.MASTER_KEY,
                'Content-Type': "application/json"
            },
            json: true
        };
        console.log('options: ', options);
        return rp.post(process.env.SERVER_URL + '/jobs/MigrateAll', options);
    };
    ResetTasks.prototype.resetTaskGroupsStartedMatching = function (taskGroup) {
        var _this = this;
        return new TaskGroupStarted_1.TaskGroupStartedQuery()
            .matchingTaskGroup(taskGroup)
            .notEnded()
            .build()
            .each(function (taskGroupStarted) {
            // finish matching
            taskGroupStarted.timeEnded = new Date();
            console.log('Reseting group started: ', taskGroupStarted.name);
            var promises = [
                taskGroupStarted.save(null, { useMasterKey: true })
            ];
            if (taskGroup.isRunToday()) {
                taskGroup.createdDay = _this.now_hours;
                var newTaskGroupStarted = new TaskGroupStarted_1.TaskGroupStarted();
                newTaskGroupStarted.copyAttributes(taskGroupStarted);
                newTaskGroupStarted.timeEnded = undefined;
                newTaskGroupStarted.timeStarted = new Date();
                promises.push([
                    taskGroup.save(null, { useMasterKey: true }),
                    taskGroupStarted.save(null, { useMasterKey: true })
                ]);
            }
            return Parse.Promise.when(promises);
        }, { useMasterKey: true });
    };
    ResetTasks.prototype.resetRegularTasksMatching = function (taskGroup) {
        var arrivedQuery = new Task_1.TaskQuery().matchingTaskStatus(Task_1.TaskStatus.ARRIVED).build();
        var abortedQuery = new Task_1.TaskQuery().matchingTaskStatus(Task_1.TaskStatus.ABORTED).build();
        var finishedQuery = new Task_1.TaskQuery().matchingTaskStatus(Task_1.TaskStatus.FINISHED).build();
        var timesArrivedQuery = new Task_1.TaskQuery().whereTimesArrivedGreaterThan(0).build();
        // let mainQuery = Parse.Query.or(arrivedQuery, abortedQuery, finishedQuery, timesArrivedQuery);
        var mainQuery = new Task_1.TaskQuery().build();
        mainQuery.equalTo(Task_1.Task._taskGroup, taskGroup);
        return mainQuery.each(function (task) {
            console.log('Reseting task', task.clientName, task.name);
            task.status = Task_1.TaskStatus.PENDING;
            task.guard = undefined;
            task.timesArrived = 0;
        }, { useMasterKey: true });
    };
    return ResetTasks;
}());
exports.ResetTasks = ResetTasks;
//# sourceMappingURL=ResetTasks.js.map