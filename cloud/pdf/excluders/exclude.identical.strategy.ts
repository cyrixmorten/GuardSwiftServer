import {EXCLUDE_MODE, ExcludeStrategy} from './exclude.strategy';
import {EventLog, TaskEvent} from '../../../shared/subclass/EventLog';
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

            const {event, remarks, guardInitials} = next;

            const cmpString = `${guardInitials}-${event}-${remarks}`

            if (current.taskEvent === TaskEvent.ARRIVE) {
                cmpArr = [];
            }

            const firstAndReportEntry = i === 0 && current.taskEvent === TaskEvent.OTHER;
            const nextIsReportEntry = next.taskEvent === TaskEvent.OTHER;

            if (firstAndReportEntry || nextIsReportEntry) {
                if (_.includes(cmpArr, cmpString)) {
                    next.setExcludeReason('Gentagelse')
                } else {
                    cmpArr.push(cmpString);
                }
            }
        }

        
        return eventLogs;
    }
}