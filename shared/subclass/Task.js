"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var BaseClass_1 = require("./BaseClass");
var QueryBuilder_1 = require("../QueryBuilder");
var _ = require("lodash");
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
var Task = (function (_super) {
    __extends(Task, _super);
    function Task() {
        return _super.call(this, Task.className) || this;
    }
    Object.defineProperty(Task.prototype, "name", {
        get: function () {
            return this.get(Task._name);
        },
        set: function (name) {
            this.set(Task._name, name);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Task.prototype, "status", {
        get: function () {
            return this.get(Task._status);
        },
        set: function (status) {
            this.set(Task._status, status);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Task.prototype, "taskType", {
        get: function () {
            return this.get(Task._taskType);
        },
        set: function (taskType) {
            this.set(Task._taskType, taskType);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Task.prototype, "taskGroup", {
        get: function () {
            return this.get(Task._taskGroup);
        },
        set: function (taskGroup) {
            this.set(Task._taskGroup, taskGroup);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Task.prototype, "timesArrived", {
        get: function () {
            return this.get(Task._timesArrived);
        },
        set: function (timesArrived) {
            this.set(Task._timesArrived, timesArrived);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Task.prototype, "guard", {
        get: function () {
            return this.get(Task._guard);
        },
        set: function (guard) {
            if (_.isUndefined(guard)) {
                this.unset(Task._guard);
                return;
            }
            this.set(Task._guard, guard);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Task.prototype, "clientId", {
        get: function () {
            return this.get(Task._clientId);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Task.prototype, "clientName", {
        get: function () {
            return this.get(Task._clientName);
        },
        enumerable: true,
        configurable: true
    });
    Task.className = 'Task';
    Task._name = 'name';
    Task._guard = 'guard';
    Task._status = 'status';
    Task._taskType = 'taskType';
    Task._taskGroup = 'taskGroup';
    Task._timesArrived = 'timesArrived';
    Task._clientId = 'clientId';
    Task._clientName = 'clientName';
    return Task;
}(BaseClass_1.BaseClass));
exports.Task = Task;
var TaskQuery = (function (_super) {
    __extends(TaskQuery, _super);
    function TaskQuery() {
        return _super.call(this, Task) || this;
    }
    TaskQuery.prototype.matchingTaskGroup = function (taskGroup) {
        this.query.equalTo(Task._taskGroup, taskGroup);
        return this;
    };
    TaskQuery.prototype.matchingTaskType = function (taskType) {
        this.query.equalTo(Task._taskType, taskType);
        return this;
    };
    TaskQuery.prototype.matchingTaskStatus = function (taskStatus) {
        this.query.equalTo(Task._status, taskStatus);
        return this;
    };
    TaskQuery.prototype.whereTimesArrivedGreaterThan = function (timesArrived) {
        this.query.greaterThan(Task._timesArrived, timesArrived);
        return this;
    };
    return TaskQuery;
}(QueryBuilder_1.QueryBuilder));
exports.TaskQuery = TaskQuery;
//# sourceMappingURL=Task.js.map