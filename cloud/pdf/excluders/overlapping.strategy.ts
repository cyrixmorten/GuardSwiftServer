import { ExcludeStrategy } from './exclude.stragegy';
import { EventLog, TaskEvent } from '../../../shared/subclass/EventLog';
import { TaskType, Task } from '../../../shared/subclass/Task';
import * as moment from 'moment-timezone';
import _ = require('lodash');

export class ExcludeOverlappingArrivalsStrategy extends ExcludeStrategy {

    run(eventLogs: EventLog[], tasks: Task[]): void {
        const MIN_DIFF_MINUTES = 10;

        const arrivalEvents = _.filter(eventLogs, (eventLog) => eventLog.matchingTaskEvent(TaskEvent.ARRIVE));

        if (_.isEmpty(arrivalEvents)) {
            return;
        }

        let currentArrivalEvent = _.head(arrivalEvents);

        _.tail(arrivalEvents).forEach((arrivalEvent) => {
            const arrivalEventTime = moment(arrivalEvent.deviceTimestamp);
            const currentArrivalTime = moment(currentArrivalEvent.deviceTimestamp);
            
            const diffMinutes = Math.abs(currentArrivalTime.diff(arrivalEventTime, 'minutes'));

            if (diffMinutes <= MIN_DIFF_MINUTES) {
                // guard has driven to the client and then started walking
                if (currentArrivalEvent.taskType !== arrivalEvent.taskType) {
                    if (currentArrivalEvent.matchingTaskType(TaskType.RAID)) {
                        currentArrivalEvent.setExcludeReason(`Fjernet til fordel for gående ankomst ${moment(arrivalEventTime).tz(this.timeZone).format('HH:mm')}`);
                    }
                    if (arrivalEvent.matchingTaskType(TaskType.RAID)) {
                        arrivalEvent.setExcludeReason(`Fjernet til fordel for gående ankomst ${moment(currentArrivalTime).tz(this.timeZone).format('HH:mm')}`);
                    }
                } else {
                    currentArrivalEvent.setExcludeReason(`Mindre end ${MIN_DIFF_MINUTES} minutter siden forrige ankomst (${diffMinutes} minutter)`);
                }  

            }

            currentArrivalEvent = arrivalEvent;
        });
        
    }
}