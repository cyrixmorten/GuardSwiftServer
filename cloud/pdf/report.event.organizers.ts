import { EventLog, TaskEvent } from '../../shared/subclass/EventLog';
import _ = require('lodash');
import move from 'lodash-move';

export class ReportEventOrganizers {

    public static moveFirstArrivalToTop(eventLogs: EventLog[]): EventLog[] {
        const arrivalEvents = _.filter(eventLogs, (eventLog) => eventLog.matchingTaskEvent(TaskEvent.ARRIVE) && !eventLog.getExcludeReason());

        if (!_.isEmpty(arrivalEvents)) {
            const fromIndex = _.indexOf(eventLogs, _.head(arrivalEvents));
            eventLogs = move(eventLogs, fromIndex, 0);
        }

        return eventLogs;
    };

    public static sortByTime(eventLogs: EventLog[]): EventLog[] {
        return _.sortBy(eventLogs, (eventLog: EventLog) => eventLog.deviceTimestamp);
    }

}