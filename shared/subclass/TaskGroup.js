"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseClass_1 = require("./BaseClass");
const _ = require("lodash");
class TaskGroup extends BaseClass_1.BaseClass {
    constructor() {
        super(TaskGroup.className);
    }
    get name() {
        return this.get(TaskGroup._name);
    }
    set name(name) {
        this.set(TaskGroup._name, name);
    }
    get createdDay() {
        return this.get(TaskGroup._createdDay);
    }
    set createdDay(day) {
        this.set(TaskGroup._createdDay, day);
    }
    get days() {
        return this.get(TaskGroup._days);
    }
    set days(days) {
        this.set(TaskGroup._days, days);
    }
    get timeResetDate() {
        return this.get(TaskGroup._timeResetDate);
    }
    set timeResetDate(date) {
        this.set(TaskGroup._timeResetDate, date);
    }
    get timeResetHour() {
        return this.timeResetDate.getHours();
    }
    /**
     * Is the current day of week included in the days array
     *
     * @returns {boolean}
     */
    isRunToday() {
        // TODO check against holidays
        return _.includes(this.days, new Date().getDay());
    }
    hoursUntilReset() {
        return this.timeResetHour - new Date().getHours();
    }
    /**
     * Is the current hour in time equal to resetTime
     */
    resetNow() {
        return this.hoursUntilReset() === 0;
    }
}
TaskGroup.className = 'TaskGroup';
TaskGroup._name = 'name';
TaskGroup._createdDay = 'createdDay';
TaskGroup._days = 'days';
TaskGroup._timeResetDate = 'timeResetDate';
exports.TaskGroup = TaskGroup;
//# sourceMappingURL=TaskGroup.js.map