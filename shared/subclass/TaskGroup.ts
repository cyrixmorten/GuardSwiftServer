import {BaseClass} from "./BaseClass";
import * as _ from "lodash";
import { Holidays } from '../moment-holiday/holidays';
import { Planning } from '../Planning';

export class TaskGroup extends BaseClass {

    static readonly className = 'TaskGroup';

    static readonly _name = 'name';
    static readonly _createdDay = 'createdDay';
    static readonly _days = 'days';
    static readonly _timeResetDate = 'timeResetDate';

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
        this.set(TaskGroup._timeResetDate, date);
    }

    get timeResetHour(): number {
        return this.timeResetDate.getHours();
    }

    /**
     * Returns true if group is planned for today
     *
     * @param countryCode used to determine if it is a holiday
     */
    isRunToday(countryCode?: string): boolean {
        return Planning.isRunToday(this.days, countryCode);
    }

    hoursUntilReset(): number {
        return this.timeResetHour - new Date().getHours();
    }

    /**
     * Is the current hour in time equal to or less than resetTime
     */
    resetNow(): boolean {
        return this.hoursUntilReset() <= 0;
    }
}