"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseClass_1 = require("./BaseClass");
const QueryBuilder_1 = require("../QueryBuilder");
const _ = require("lodash");
var TaskStatus;
(function (TaskStatus) {
    TaskStatus[TaskStatus["PENDING"] = 'pending'] = "PENDING";
    TaskStatus[TaskStatus["ACCEPTED"] = 'accepted'] = "ACCEPTED";
    TaskStatus[TaskStatus["ARRIVED"] = 'arrived'] = "ARRIVED";
    TaskStatus[TaskStatus["ABORTED"] = 'aborted'] = "ABORTED";
    TaskStatus[TaskStatus["FINISHED"] = 'finished'] = "FINISHED";
})(TaskStatus = exports.TaskStatus || (exports.TaskStatus = {}));
var TaskType;
(function (TaskType) {
    TaskType[TaskType["REGULAR"] = 'Regular'] = "REGULAR";
    TaskType[TaskType["STATIC"] = 'Static'] = "STATIC";
    TaskType[TaskType["ALARM"] = 'Alarm'] = "ALARM";
})(TaskType = exports.TaskType || (exports.TaskType = {}));
class Task extends BaseClass_1.BaseClass {
    constructor() {
        super(Task.className);
    }
    get name() {
        return this.get(Task._name);
    }
    set name(name) {
        this.set(Task._name, name);
    }
    get status() {
        return this.get(Task._status);
    }
    set status(status) {
        this.set(Task._status, status);
    }
    get taskType() {
        return this.get(Task._taskType);
    }
    set taskType(taskType) {
        this.set(Task._taskType, taskType);
    }
    get taskGroup() {
        return this.get(Task._taskGroup);
    }
    set taskGroup(taskGroup) {
        this.set(Task._taskGroup, taskGroup);
    }
    get taskGroupStarted() {
        return this.get(Task._taskGroupStarted);
    }
    set taskGroupStarted(taskGroupStarted) {
        if (_.isUndefined(taskGroupStarted)) {
            this.unset(Task._taskGroupStarted);
            return;
        }
        this.set(Task._taskGroupStarted, taskGroupStarted);
    }
    get timesArrived() {
        return this.get(Task._timesArrived);
    }
    set timesArrived(timesArrived) {
        this.set(Task._timesArrived, timesArrived);
    }
    set guard(guard) {
        if (_.isUndefined(guard)) {
            this.unset(Task._guard);
            return;
        }
        this.set(Task._guard, guard);
    }
    get guard() {
        return this.get(Task._guard);
    }
    get clientId() {
        return this.get(Task._clientId);
    }
    get clientName() {
        return this.get(Task._clientName);
    }
    set days(days) {
        this.set(Task._days, days);
    }
    get days() {
        return this.get(Task._days);
    }
    set isRunToday(isRunToday) {
        this.set(Task._isRunToday, isRunToday);
    }
    get isRunToday() {
        return this.get(Task._isRunToday);
    }
}
Task.className = 'Task';
Task._name = 'name';
Task._guard = 'guard';
Task._status = 'status';
Task._taskType = 'taskType';
Task._taskGroup = 'taskGroup';
Task._taskGroupStarted = 'taskGroupStarted';
Task._timesArrived = 'timesArrived';
Task._clientId = 'clientId';
Task._clientName = 'clientName';
Task._days = 'days';
Task._isRunToday = 'isRunToday';
exports.Task = Task;
class TaskQuery extends QueryBuilder_1.QueryBuilder {
    constructor() {
        super(Task);
    }
    matchingTaskGroup(taskGroup) {
        this.query.equalTo(Task._taskGroup, taskGroup);
        return this;
    }
    matchingTaskType(taskType) {
        this.query.equalTo(Task._taskType, taskType);
        return this;
    }
    matchingTaskStatus(taskStatus) {
        this.query.equalTo(Task._status, taskStatus);
        return this;
    }
    whereTimesArrivedGreaterThan(timesArrived) {
        this.query.greaterThan(Task._timesArrived, timesArrived);
        return this;
    }
}
exports.TaskQuery = TaskQuery;
//# sourceMappingURL=Task.js.map