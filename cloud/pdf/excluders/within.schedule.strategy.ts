import {ExcludeStrategy} from './exclude.strategy';
import {EventLog, TaskEvent} from '../../../shared/subclass/EventLog';
import {TaskType} from '../../../shared/subclass/Task';
import {ReportEventFilters} from "../report.event.filters";
import _ = require('lodash');

export class PreferArrivalsWithinScheduleStrategy extends ExcludeStrategy {

    run({eventLogs, tasks, mode}): EventLog[] {

        const regularOrRaidTasks = tasks.filter((task) => {
            return task.matchingTaskType(TaskType.REGULAR, TaskType.RAID);
        });

        if (_.isEmpty(regularOrRaidTasks)) {
            return;
        }

        let targetSupervisions = _.sum(_.map(tasks, (task) => task.supervisions));

        // reverse to throw out latest arrivals
        let arrivalEvents = _.reverse(
            _.filter(ReportEventFilters.notExcludedEvents(eventLogs),
                (eventLog: EventLog) => eventLog.taskEvent === TaskEvent.ARRIVE)
        );


        const arrivalsCount = arrivalEvents.length;
        const extraArrivals = arrivalsCount - targetSupervisions;

        if (extraArrivals > 0) {
            let pruneCount = 0;

            let pruneExtraArrivals = (events: EventLog[], ignoreSchedule: boolean) => {
                return _.compact(_.forEach(events, (arriveEvent: EventLog) => {
                    const withinSchedule = arriveEvent.withinSchedule;


                    const prune = (ignoreSchedule || !withinSchedule) && pruneCount !== extraArrivals;

                    if (prune && !arriveEvent.isMarkedToBeIncludedInReport()) {

                        if (withinSchedule) {
                            arriveEvent.setExcludeReason(`Flere ankomster end planlagt for tilsyn`);
                        } else {
                            arriveEvent.setExcludeReason(`Uden for planlagt tidsrum`);
                        }

                        pruneCount++;
                    } else {
                        return arriveEvent;
                    }
                }));
            };

            // first remove events outside schedule
            const arrivedWithinSchedule = pruneExtraArrivals(arrivalEvents, false);
            // remove more within schedule if there still are too many arrival events
            pruneExtraArrivals(arrivedWithinSchedule, true);
        }

        return eventLogs;
    }
}