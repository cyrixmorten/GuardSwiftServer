import { EventLog, TaskEvent } from '../../shared/subclass/EventLog';
import * as _ from 'lodash';
import { TaskType } from '../../shared/subclass/Task';

export interface IManualAutomaticArrivalStatistics {
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

export class ManualAutomaticArrivalStatistics {

    constructor(
            private events: EventLog[],
        ) {}

    public create(taskType: TaskType): IManualAutomaticArrivalStatistics {

        const arrivalEvents = _.filter(this.events, (event) => {
            return event.matchingTaskEvent(TaskEvent.ARRIVE) && event.matchingTaskType(taskType)
        });

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