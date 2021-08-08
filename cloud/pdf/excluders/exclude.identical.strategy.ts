import { EXCLUDE_MODE, ExcludeStrategy } from './exclude.strategy';
import { EventLog, TaskEvent } from '../../../shared/subclass/EventLog';
import _ = require('lodash');

export class ExcludeIdenticalStrategy extends ExcludeStrategy {

    run({eventLogs, tasks, mode}): EventLog[] {

        if (mode !== EXCLUDE_MODE.GUARD) {
            return eventLogs;
        }

        let cmpArr = [];

        for (let i = 0; i < eventLogs.length - 1; i++) {

            const current = eventLogs[i];
            const next = eventLogs[i + 1];

            if (current.taskEvent === TaskEvent.ARRIVE) {
                cmpArr = [];
            }

            if (next.taskEvent === TaskEvent.OTHER) {
                const {event, remarks, guard} = next;

                const cmpString = `${guard}-${event}-${remarks}`

                if (_.includes(cmpArr, cmpString)) {
                    next.setExcludeReason('Gentagelse')
                }
            }
        }
        
        return eventLogs;
    }
}