import {EXCLUDE_MODE, ExcludeStrategy} from './exclude.strategy';
import {EventLog, TaskEvent} from '../../../shared/subclass/EventLog';
import {TaskType} from '../../../shared/subclass/Task';
import * as moment from 'moment-timezone';
import _ = require('lodash');
import {ReportEventFilters} from "../report.event.filters";

export class ExcludeOverlappingArrivalsStrategy extends ExcludeStrategy {

    run({eventLogs, tasks, mode}): EventLog[] {

        if (mode !== EXCLUDE_MODE.ALL) {
            return eventLogs;
        }

        const MIN_DIFF_MINUTES = 10;

        let targetSupervisions = _.sum(_.map(tasks, (task) => task.supervisions));

        let allArrivalEvents = _.filter(ReportEventFilters.notExcludedEvents(eventLogs),
            (eventLog: EventLog) => eventLog.matchingTaskEvent(TaskEvent.ARRIVE)
        );

        let excludedCount = 0;
        const maxExcludeCount = allArrivalEvents.length - targetSupervisions;

        if (maxExcludeCount <= 0) {
            return eventLogs;
        }

        for (let i = 0; i < (allArrivalEvents.length - 1); i++) {

            if (excludedCount === maxExcludeCount) {
                continue;
            }

            let currentIndex = i;
            let currentArrival = allArrivalEvents[currentIndex]
            while (currentArrival.isExcludedFromReport()) {
                currentIndex -= 1;
                currentArrival = allArrivalEvents[currentIndex];
            }


            const nextArrival = allArrivalEvents[i + 1];


            const currentArrivalTime = moment(currentArrival.deviceTimestamp);
            const nextArrivalTime = moment(nextArrival.deviceTimestamp);

            const diffMinutes = Math.abs(currentArrivalTime.diff(nextArrivalTime, 'minutes'));

            if (diffMinutes <= MIN_DIFF_MINUTES) {

                // guard has driven to the client and then started walking
                if (currentArrival.matchingTaskType(TaskType.RAID) && nextArrival.matchingTaskType(TaskType.REGULAR)) {

                    if (!currentArrival.withinSchedule || !nextArrival.withinSchedule) {
                        // assume intend drive -> walk equals intend to do regular supervision
                        const arrivalToExclude = currentArrival.matchingTaskType(TaskType.RAID) ? currentArrival : nextArrival;
                        arrivalToExclude.setExcludeReason(`Fjernet til fordel for gående ankomst ${moment(nextArrivalTime).tz(this.timeZone).format('HH:mm')}`);
                    }
                } else {
                    nextArrival.setExcludeReason(`Mindre end ${MIN_DIFF_MINUTES} minutter siden forrige ankomst (${diffMinutes} minutter)`);
                }

                excludedCount++;
            }

        }

        return eventLogs;
    }
}