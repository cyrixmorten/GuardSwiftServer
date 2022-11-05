import {EXCLUDE_MODE, ExcludeStrategy, RunParams} from './exclude.strategy';
import {EventLog, TaskEvent} from '../../../shared/subclass/EventLog';
import _ = require('lodash');

export class ExcludeIdenticalStrategy extends ExcludeStrategy {

    run({eventLogs, tasks, mode}: RunParams): EventLog[] {

        if (mode !== EXCLUDE_MODE.GUARD) {
            return eventLogs;
        }

        const cmprSet = new Set<string>();


        for (let i = 0; i < eventLogs.length - 1; i++) {

            const current = eventLogs[i];
            const next = eventLogs[i + 1];

            const {guardInitials, event, amount, clientLocation, remarks} = next;

            
            const cmpString = `${guardInitials}:${event}:${amount}:${clientLocation}:${remarks}`

            if (current.taskEvent === TaskEvent.ARRIVE) {
                cmprSet.clear();
            }

            const firstAndReportEntry = i === 0 && current.taskEvent === TaskEvent.OTHER;
            const nextIsReportEntry = next.taskEvent === TaskEvent.OTHER;

            if (firstAndReportEntry || nextIsReportEntry) {
                if (cmprSet.has(cmpString)) {
                    next.setExcludeReason('Gentagelse ' + cmpString)
                } else {
                    cmprSet.add(cmpString);
                }
            }
        }

        
        return eventLogs;
    }
}