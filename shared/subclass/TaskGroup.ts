import { BaseClass } from "./BaseClass";
import { Planning } from '../Planning';
import { QueryBuilder } from '../QueryBuilder';
import * as moment from 'moment-timezone';

export class TaskGroup extends BaseClass {

    static readonly className = 'TaskGroup';

    static readonly _name = 'name';
    static readonly _createdDay = 'createdDay';
    static readonly _days = 'days';
    static readonly _timeResetDate = 'timeResetDate';
    static readonly _resetDate = 'resetDate';

    constructor() {
        super(TaskGroup.className);

    }

    get name(): string {
        return this.get(TaskGroup._name);
    }

    set name(name: string) {
        this.set(TaskGroup._name, name);
    }

    get createdDay(): number {
        return this.get(TaskGroup._createdDay);
    }

    set createdDay(day: number) {
        this.set(TaskGroup._createdDay, day);
    }

    get days(): number[] {
        return this.get(TaskGroup._days);
    }

    set days(days: number[]) {
        this.set(TaskGroup._days, days);
    }

    get timeResetDate(): Date {
        return this.get(TaskGroup._timeResetDate);
    }

    set timeResetDate(date: Date) {
        date.setSeconds(0);
        this.set(TaskGroup._timeResetDate, date);
    }

    get resetDate(): Date {
        return this.get(TaskGroup._resetDate);
    }

    set resetDate(date: Date) {
        date.setSeconds(0);
        this.set(TaskGroup._resetDate, date);
    }

    getResetDay(): number {
        return this.resetDate ? this.resetDate.getDay() : this.createdDay;
    }

    getResetHour(timeZone: string): number {
        return moment(this.timeResetDate).tz(timeZone).hours();
    }

    getResetMinutes(timeZone: string): number {
        return moment(this.timeResetDate).tz(timeZone).minutes();
    }

    /**
     * Returns true if group is planned for today
     *
     * @param countryCode used to determine if it is a holiday
     */
    isRunToday(countryCode?: string): boolean {
        return Planning.isRunToday(this.days, countryCode);
    }

    hoursUntilReset(timeZone: string): number {
        return this.getResetHour(timeZone) - new Date().getHours();
    }

    minutesUntilReset(timeZone: string): number {
        return this.getResetMinutes(timeZone) - new Date().getMinutes();
    }

    resetNow(timeZone: string): boolean {
        return this.hoursUntilReset(timeZone) <= 0 &&
            this.minutesUntilReset(timeZone) <= 0;
    }
}

export class TaskGroupQuery extends QueryBuilder<TaskGroup> {

    constructor() {
        super(TaskGroup);
    }

}