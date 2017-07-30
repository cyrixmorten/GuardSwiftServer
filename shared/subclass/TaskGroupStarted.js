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
var _ = require("lodash");
var QueryBuilder_1 = require("../QueryBuilder");
var TaskGroupStarted = (function (_super) {
    __extends(TaskGroupStarted, _super);
    function TaskGroupStarted(attr) {
        var _this = _super.call(this, TaskGroupStarted.className) || this;
        if (attr) {
            if (attr.taskGroup) {
                _this.owner = attr.taskGroup.owner;
                _this.name = attr.taskGroup.name;
                _this.taskGroup = attr.taskGroup.toPointer();
                _this.timeStarted = new Date();
                _this.setACL(attr.taskGroup.getACL());
            }
        }
        return _this;
    }
    Object.defineProperty(TaskGroupStarted.prototype, "name", {
        get: function () {
            return this.get(TaskGroupStarted._name);
        },
        set: function (name) {
            this.set(TaskGroupStarted._name, name);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TaskGroupStarted.prototype, "taskGroup", {
        get: function () {
            return this.get(TaskGroupStarted._taskGroup);
        },
        set: function (taskGroup) {
            this.set(TaskGroupStarted._taskGroup, taskGroup);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TaskGroupStarted.prototype, "timeStarted", {
        get: function () {
            return this.get(TaskGroupStarted._timeStarted);
        },
        set: function (date) {
            this.set(TaskGroupStarted._timeStarted, date);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TaskGroupStarted.prototype, "timeEnded", {
        get: function () {
            return this.get(TaskGroupStarted._timeEnded);
        },
        set: function (date) {
            if (_.isUndefined(date)) {
                this.unset(TaskGroupStarted._timeEnded);
                return;
            }
            this.set(TaskGroupStarted._timeEnded, date);
        },
        enumerable: true,
        configurable: true
    });
    TaskGroupStarted.className = 'TaskGroupStarted';
    TaskGroupStarted._name = 'name';
    TaskGroupStarted._taskGroup = 'taskGroup';
    TaskGroupStarted._timeStarted = 'timeStarted';
    TaskGroupStarted._timeEnded = 'timeEnded';
    return TaskGroupStarted;
}(BaseClass_1.BaseClass));
exports.TaskGroupStarted = TaskGroupStarted;
var TaskGroupStartedQuery = (function (_super) {
    __extends(TaskGroupStartedQuery, _super);
    function TaskGroupStartedQuery() {
        return _super.call(this, TaskGroupStarted) || this;
    }
    TaskGroupStartedQuery.prototype.matchingTaskGroup = function (taskGroup) {
        this.query.equalTo(TaskGroupStarted._taskGroup, taskGroup);
        return this;
    };
    TaskGroupStartedQuery.prototype.notEnded = function () {
        this.query.doesNotExist(TaskGroupStarted._timeEnded);
        return this;
    };
    return TaskGroupStartedQuery;
}(QueryBuilder_1.QueryBuilder));
exports.TaskGroupStartedQuery = TaskGroupStartedQuery;
//# sourceMappingURL=TaskGroupStarted.js.map