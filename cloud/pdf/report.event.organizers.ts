import {EventLog, TaskEvent} from '../../shared/subclass/EventLog';
import move from 'lodash-move';
import _ = require('lodash');

export class ReportEventOrganizers {

    public static moveFirstArrivalToTop(eventLogs: EventLog[]): EventLog[] {
        const arrivalEvents = _.filter(eventLogs, (eventLog) => eventLog.matchingTaskEvent(TaskEvent.ARRIVE) && !eventLog.getExcludeReason());

        if (!_.isEmpty(arrivalEvents)) {
            const fromIndex = _.indexOf(eventLogs, _.head(arrivalEvents));
            eventLogs = move(eventLogs, fromIndex, 0);
        }

        return eventLogs;
    };

    public static mergeArrivalWithFirstOther(eventLogs: EventLog[]): EventLog[] {
        return _.compact(_.flatMap(eventLogs, (event, index) => {
            const previousEvent = (index !== 0) ? eventLogs[index - 1] : undefined;
            const previousEventIsArrival = previousEvent !== undefined && previousEvent.matchingTaskEvent(TaskEvent.ARRIVE);
            const nextEvent = (index + 1 < eventLogs.length) ? eventLogs[index + 1] : undefined;
            const nextEventIsOther = nextEvent !== undefined && nextEvent.matchingTaskEvent(TaskEvent.OTHER);

            if (event.matchingTaskEvent(TaskEvent.ARRIVE) && nextEventIsOther) {
                event.event = nextEvent.event;
                event.clientLocation = nextEvent.clientLocation;
                event.amount = nextEvent.amount;
                event.people = nextEvent.people;
                event.remarks = nextEvent.remarks;
                event.isMerged = true;
            }

            if (event.matchingTaskEvent(TaskEvent.OTHER) && previousEventIsArrival) {
                return undefined; // have been merged
            }

            return event;
        }));
    };

    public static sortByTime(eventLogs: EventLog[]): EventLog[] {
        return _.sortBy(eventLogs, (eventLog: EventLog) => eventLog.deviceTimestamp);
    }

}