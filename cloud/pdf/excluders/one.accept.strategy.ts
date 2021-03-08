import { ExcludeStrategy } from './exclude.strategy';
import { EventLog, TaskEvent } from '../../../shared/subclass/EventLog';
import _ = require('lodash');

export class OneAcceptStrategy extends ExcludeStrategy {

    run({eventLogs}): EventLog[] {

        let acceptEvents: EventLog[] = _.filter(eventLogs, (eventLog: EventLog) => eventLog.taskEvent === TaskEvent.ACCEPT);

        if (acceptEvents.length > 1) {

            let acceptEventByArrivedGuard = () => {

                let arrivalEvent: EventLog = _.find(eventLogs, (eventLog: EventLog) => eventLog.taskEvent === TaskEvent.ARRIVE);

                if (arrivalEvent) {
                    return _.find(acceptEvents, (acceptEvent) => acceptEvent.guardName === arrivalEvent.guardName)
                }

            };

            // either select the guard arriving, or pick the first
            let acceptEventToKeep = acceptEventByArrivedGuard() || _.first(acceptEvents);

            // remove all accept events except acceptEventToKeep
            _.difference(eventLogs, _.pull(acceptEvents, acceptEventToKeep)).forEach((event) => {
                event.setExcludeReason(`Vis kun én accept per rapport`)
            })
        }
        
        return eventLogs;
    }
}