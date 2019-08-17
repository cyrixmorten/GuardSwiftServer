import { ExcludeStrategy } from './exclude.stragegy';
import { EventLog, TaskEvent } from '../../../shared/subclass/EventLog';
import { TaskType, Task } from '../../../shared/subclass/Task';
import _ = require('lodash');

export class PreferArrivalsWithinScheduleStrategy extends ExcludeStrategy {

    run(eventLogs: EventLog[], tasks: Task[]): void {

        const regularOrRaidTasks = tasks.filter((task) => {
            return task.matchingTaskType(TaskType.REGULAR, TaskType.RAID);
        });

        if (_.isEmpty(regularOrRaidTasks)) {
            return;
        }
    
        let targetSupervisions = _.sum(_.map(tasks, (task) => task.supervisions));
        // reverse to throw out latest arrivals
        let arrivalEvents = _.reverse(_.filter(eventLogs, (eventLog: EventLog) => eventLog.taskEvent === TaskEvent.ARRIVE));
        
    
        const arrivalsCount = arrivalEvents.length;
        const extraArrivals = arrivalsCount - targetSupervisions;
    
        if (extraArrivals > 0) {
            let pruneCount = 0;
    
            let pruneExtraArrivals = (events: EventLog[], ignoreSchedule: boolean) => {
                return _.compact(_.forEach(events, (arriveEvent: EventLog) => {
                    const withinSchedule = arriveEvent.withinSchedule;

                    if ((ignoreSchedule || !withinSchedule) && pruneCount !== extraArrivals) {
                        
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
            const arrievedWithinSchedule = pruneExtraArrivals(arrivalEvents, false);
            // remove more within schedule if there still are too many arrival events
            pruneExtraArrivals(arrievedWithinSchedule, true);
        }
    }
}