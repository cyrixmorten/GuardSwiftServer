import { ExcludeStrategy } from './exclude.stragegy';
import { EventLog, TaskEvent } from '../../../shared/subclass/EventLog';
import { TaskType, Task } from '../../../shared/subclass/Task';
import * as moment from 'moment-timezone';
import { ReportEventFilters } from '../report.event.filters';
import _ = require('lodash');

export class ExcludeOverlappingArrivalsStrategy extends ExcludeStrategy {

    run(eventLogs: EventLog[], tasks: Task[]): void {
        const MIN_DIFF_MINUTES = 10;

        const arrivalEvents = _.filter(eventLogs, (eventLog) => eventLog.matchingTaskEvent(TaskEvent.ARRIVE));

        if (_.isEmpty(arrivalEvents)) {
            return;
        }

        for (let i = 0; i<arrivalEvents.length; i++) {

            const currentArrival = arrivalEvents[i];

            const task = _.find(tasks, (t) => t.id === currentArrival.task.id);
            const arrivalsMatchingTask = _.filter(arrivalEvents, (e) => e.task.id === task.id);

            if (arrivalsMatchingTask.length <= task.supervisions) {
                continue;
            }

            for (let j = 0; j<ReportEventFilters.notExcludedEvents(arrivalEvents).length; j++) {
                if (i === j) {
                    continue;
                }

                const compareArrival = arrivalEvents[j];

                const currentArrivalTime = moment(currentArrival.deviceTimestamp);
                const compareArrivalTime = moment(compareArrival.deviceTimestamp);
                
                const diffMinutes = Math.abs(currentArrivalTime.diff(compareArrivalTime, 'minutes'));

                if (diffMinutes <= MIN_DIFF_MINUTES) {
                    // guard has driven to the client and then started walking
                    if (currentArrival.matchingTaskType(TaskType.RAID) && compareArrival.matchingTaskType(TaskType.REGULAR)) {
                        if (!currentArrival.withinSchedule || !compareArrival.withinSchedule) {
                            // exclude if one is outside planned time
                            if (!currentArrival.withinSchedule) {
                                currentArrival.setExcludeReason(`Uden for planlagt tidsrum - fjernet til fordel for ankomst ${moment(compareArrivalTime).tz(this.timeZone).format('HH:mm')}`);
                            } else {
                                compareArrival.setExcludeReason(`Uden for planlagt tidsrum - fjernet til fordel for ankomst ${moment(currentArrivalTime).tz(this.timeZone).format('HH:mm')}`);
                            }
                        } else {
                            // asume intend drive -> walk equals intend to do regular supervision
                            if (currentArrival.matchingTaskType(TaskType.RAID)) {
                                currentArrival.setExcludeReason(`Fjernet til fordel for gående ankomst ${moment(compareArrivalTime).tz(this.timeZone).format('HH:mm')}`);
                            } else {
                                compareArrival.setExcludeReason(`Fjernet til fordel for gående ankomst ${moment(currentArrivalTime).tz(this.timeZone).format('HH:mm')}`);
                            }
                        }
                    } else {
                        currentArrival.setExcludeReason(`Mindre end ${MIN_DIFF_MINUTES} minutter siden forrige ankomst (${diffMinutes} minutter)`);
                    }  
                }

            }
        }
    }
}