"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseClass_1 = require("./BaseClass");
const _ = require("lodash");
const QueryBuilder_1 = require("../QueryBuilder");
class TaskGroupStarted extends BaseClass_1.BaseClass {
    constructor(attr) {
        super(TaskGroupStarted.className);
        if (attr) {
            if (attr.taskGroup) {
                this.owner = attr.taskGroup.owner;
                this.name = attr.taskGroup.name;
                this.taskGroup = attr.taskGroup.toPointer();
                this.timeStarted = new Date();
                this.setACL(attr.taskGroup.getACL());
            }
        }
    }
    get name() {
        return this.get(TaskGroupStarted._name);
    }
    set name(name) {
        this.set(TaskGroupStarted._name, name);
    }
    get taskGroup() {
        return this.get(TaskGroupStarted._taskGroup);
    }
    set taskGroup(taskGroup) {
        this.set(TaskGroupStarted._taskGroup, taskGroup);
    }
    get timeStarted() {
        return this.get(TaskGroupStarted._timeStarted);
    }
    set timeStarted(date) {
        this.set(TaskGroupStarted._timeStarted, date);
    }
    get timeEnded() {
        return this.get(TaskGroupStarted._timeEnded);
    }
    set timeEnded(date) {
        if (_.isUndefined(date)) {
            this.unset(TaskGroupStarted._timeEnded);
            return;
        }
        this.set(TaskGroupStarted._timeEnded, date);
    }
}
TaskGroupStarted.className = 'TaskGroupStarted';
TaskGroupStarted._name = 'name';
TaskGroupStarted._taskGroup = 'taskGroup';
TaskGroupStarted._timeStarted = 'timeStarted';
TaskGroupStarted._timeEnded = 'timeEnded';
exports.TaskGroupStarted = TaskGroupStarted;
class TaskGroupStartedQuery extends QueryBuilder_1.QueryBuilder {
    constructor() {
        super(TaskGroupStarted);
    }
    matchingTaskGroup(taskGroup) {
        this.query.equalTo(TaskGroupStarted._taskGroup, taskGroup);
        return this;
    }
    notEnded() {
        this.query.doesNotExist(TaskGroupStarted._timeEnded);
        return this;
    }
}
exports.TaskGroupStartedQuery = TaskGroupStartedQuery;
//# sourceMappingURL=TaskGroupStarted.js.map