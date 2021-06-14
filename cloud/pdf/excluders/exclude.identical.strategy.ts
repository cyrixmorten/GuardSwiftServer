import { ExcludeStrategy } from './exclude.strategy';
import { EventLog, TaskEvent } from '../../../shared/subclass/EventLog';
import _ = require('lodash');
import moment = require('moment-timezone');

export class ExcludeIdenticalStrategy extends ExcludeStrategy {

    run({eventLogs}): EventLog[] {

        let writtenEvents: EventLog[] = _.filter(eventLogs, (eventLog: EventLog) => eventLog.taskEvent === TaskEvent.OTHER);


        for (let i = 0; i < writtenEvents.length - 1; i++) {
            const current = writtenEvents[i];
            const next = writtenEvents[i + 1];

            const sameGuard = current.guard.id === next.guard.id;
            //const diffSeconds = moment(current.deviceTimestamp).diff(moment(next.deviceTimestamp), "seconds");
            //const sameTime =  Math.abs(diffSeconds) <= 10;
            const sameEvent = current.event === next.event;
            const sameText = current.remarks === next.remarks;


            const markIdentical = sameGuard && /*sameTime &&*/ sameEvent && sameText;

            if (markIdentical) {
                next.setExcludeReason('Gentagelse')
            }
        }
        
        return eventLogs;
    }
}