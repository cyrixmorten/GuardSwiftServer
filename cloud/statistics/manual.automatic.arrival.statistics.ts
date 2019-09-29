import { EventLog, TaskEvent } from '../../shared/subclass/EventLog';
import * as _ from 'lodash';
import { TaskType } from '../../shared/subclass/Task';
import { IManualAutomaticArrivalStatistics } from '../../shared/statistics/arrival.statistics.types';

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
            return total ? _.round(val / total * 100, 2) : 0;
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