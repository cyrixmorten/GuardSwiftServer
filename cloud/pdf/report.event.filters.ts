import { EventLog, TaskEvent } from '../../shared/subclass/EventLog';
import { TaskType, Task } from '../../shared/subclass/Task';
import _ = require('lodash');

export class ReportEventFilters {

    public static reportEventsMatchingTasks(eventLogs: EventLog[], tasks: Task[]): EventLog[] {

        const taskIds = _.map(tasks, (task: Task) => task.id);
        const taskEventLogs = _.filter(eventLogs, (eventLog) => _.includes(taskIds, eventLog.task.id));

        return _.filter(taskEventLogs, (eventLog: EventLog) => {
            if (_.sample(tasks).isType(TaskType.ALARM)) {
                return eventLog.matchingTaskEvent(TaskEvent.ACCEPT, TaskEvent.ARRIVE, TaskEvent.ABORT, TaskEvent.FINISH, TaskEvent.OTHER)
            }
            else {
                return eventLog.matchingTaskEvent(TaskEvent.ARRIVE, TaskEvent.OTHER)
            }
        });
    };

    public static notExcludedEvents(eventLogs: EventLog[]): EventLog[] {
        return _.reject(eventLogs, (event: EventLog) => !!event.getExcludeReason());
    }

}