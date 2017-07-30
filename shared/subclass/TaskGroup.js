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
var TaskGroup = (function (_super) {
    __extends(TaskGroup, _super);
    function TaskGroup() {
        return _super.call(this, TaskGroup.className) || this;
    }
    Object.defineProperty(TaskGroup.prototype, "name", {
        get: function () {
            return this.get(TaskGroup._name);
        },
        set: function (name) {
            this.set(TaskGroup._name, name);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TaskGroup.prototype, "createdDay", {
        get: function () {
            return this.get(TaskGroup._createdDay);
        },
        set: function (day) {
            this.set(TaskGroup._createdDay, day);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TaskGroup.prototype, "days", {
        get: function () {
            return this.get(TaskGroup._days);
        },
        set: function (days) {
            this.set(TaskGroup._days, days);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TaskGroup.prototype, "timeResetDate", {
        get: function () {
            return this.get(TaskGroup._timeResetDate);
        },
        set: function (date) {
            this.set(TaskGroup._timeResetDate, date);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TaskGroup.prototype, "timeResetHour", {
        get: function () {
            return this.timeResetDate.getHours();
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Is the current day of week included in the days array
     *
     * @returns {boolean}
     */
    TaskGroup.prototype.isRunToday = function () {
        // TODO check against holidays
        return _.includes(this.days, new Date().getDay());
    };
    TaskGroup.prototype.hoursUntilReset = function () {
        return this.timeResetHour - new Date().getHours();
    };
    /**
     * Is the current hour in time equal to resetTime
     */
    TaskGroup.prototype.resetNow = function () {
        return this.hoursUntilReset() === 0;
    };
    TaskGroup.className = 'TaskGroup';
    TaskGroup._name = 'name';
    TaskGroup._createdDay = 'createdDay';
    TaskGroup._days = 'days';
    TaskGroup._timeResetDate = 'timeResetDate';
    return TaskGroup;
}(BaseClass_1.BaseClass));
exports.TaskGroup = TaskGroup;
//# sourceMappingURL=TaskGroup.js.map