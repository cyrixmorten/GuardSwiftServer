import { EventLog, TaskEvent } from '../../shared/subclass/EventLog';
import * as _ from 'lodash';

export interface IManualAutomaticArrivalObject {
    total: number;
    count: {
        manual: number;
        automatic: number;
    },
    percentage: {
        manual: number;
        automatic: number;
    }
}

export class ManualAutomaticArrivalObject {

    constructor(
            private events: EventLog[],
        ) {}

    public create(): IManualAutomaticArrivalObject {

        const arrivalEvents = _.filter(this.events, (event) => event.matchingTaskEvent(TaskEvent.ARRIVE));

        const total = arrivalEvents.length;
        const manual = _.sumBy(arrivalEvents, (event) => !event.automatic ? 1 : 0);
        const automatic = _.sumBy(arrivalEvents, (event) => event.automatic ? 1 : 0);

        const toPercentage = (val: number) => {
            return total ? manual / total * 100 : 0;
        } 

        return {
            total,
            count: {
                manual,
                automatic
            },
            percentage: {
                manual: toPercentage(manual),
                automatic: toPercentage(automatic),
            }
        }
    }


}