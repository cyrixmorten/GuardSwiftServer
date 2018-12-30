import * as moment from 'moment-holiday';

export class Holidays {

    constructor(countryCode: string = 'dk') {
        try {
            require(`./holidays-${countryCode}`);
        } catch (e) {
            console.error(`No holidays for country code: ${countryCode}`);
        }
    }

    public isHoliday(date?: Date) {
        return moment().isHoliday(date);
    }
}