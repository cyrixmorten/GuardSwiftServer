import { Holidays } from './moment-holiday/holidays';
import * as _ from 'lodash';

export class Planning {

    public static isRunToday(plannedDays: number[], countryCode?: string, debug?: boolean): boolean {
        const dayOfWeek = new Date().getDay();
        const isHoliday = new Holidays(countryCode).isHoliday();

        const matchPlannedDay = _.includes(plannedDays, dayOfWeek);
        const matchHoliday = _.includes(plannedDays, 0) && !!isHoliday; // 0 is sunday

        return matchPlannedDay || matchHoliday;
    }
}