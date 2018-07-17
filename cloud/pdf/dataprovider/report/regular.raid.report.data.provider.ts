import {IReportDataProvider, ReportData} from "./report.data.provider";
import {Report} from "../../../../shared/subclass/Report";
import {Dictionary} from "lodash";
import {Task, TaskType} from "../../../../shared/subclass/Task";
import {EventLog, TaskEvent} from "../../../../shared/subclass/EventLog";
import * as _ from "lodash";

export class RegularRaidReportDataProvider implements IReportDataProvider {

    private tasksGroupedByHeader(report: Report) : Dictionary<Task[]> {

        let taskTypeHeader = (task: Task) => {
            // if (task.type) {
            //     return task.type;
            // }

            // TODO translate
            switch (task.taskType) {
                case TaskType.STATIC:
                    return "Fastvagt";
                case TaskType.ALARM:
                    return "Alarm";
                case TaskType.REGULAR:
                    return "Gående tilsyn";
                case TaskType.RAID:
                    return "Kørende tilsyn";
            }
        };

        return _.groupBy(report.tasks || [report.task], taskTypeHeader)
    }

    private eventLogsGroupedByHeader(report: Report, groupedTasks: Dictionary<Task[]>) {
        let groupedEventLogs: Dictionary<EventLog[]> = {};

        _.forOwn(groupedTasks, (tasks: Task[], header: string) => {
            groupedEventLogs[header] = this.organizeEvents(report, tasks);
        });

        return groupedEventLogs;
    }

    private organizeEvents(report: Report, tasks: Task[]): EventLog[] {

        let taskIds = _.map(tasks, (task: Task) => task.id);
        let taskEventLogs = _.filter(report.eventLogs, (eventLog) => _.includes(taskIds, eventLog.task.id));

        let removeNonReportEvents = (eventLogs: EventLog[]): EventLog[] => {
            return _.filter(eventLogs, (eventLog: EventLog) => {
                if (_.sample(tasks).isType(TaskType.ALARM)) {
                    return eventLog.matchingTaskEvent(TaskEvent.ACCEPT, TaskEvent.ARRIVE, TaskEvent.ABORT, TaskEvent.FINISH, TaskEvent.OTHER)
                }
                else {
                    return eventLog.matchingTaskEvent(TaskEvent.ARRIVE, TaskEvent.OTHER)
                }
            });
        };

        let onlyWriteAcceptOnce = (eventLogs: EventLog[]): EventLog[] => {

            if (!report.matchingTaskType(TaskType.ALARM)) {
                return eventLogs;
            }

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
                return _.difference(eventLogs, _.pull(acceptEvents, acceptEventToKeep))
            }
            else {
                return eventLogs;
            }
        };

        let preferArrivalsWithinSchedule = (eventLogs: EventLog[]): EventLog[] => {
            if (!report.matchingTaskType(TaskType.REGULAR, TaskType.RAID)) {
                return eventLogs;
            }

            let targetSupervisions = _.sum(_.map(tasks, (task) => task.supervisions));
            let arrivalEvents = _.filter(eventLogs, (eventLog: EventLog) => eventLog.taskEvent === TaskEvent.ARRIVE);

            let extraArrivals = arrivalEvents.length - targetSupervisions;

            if (extraArrivals > 0) {
                let pruneCount = 0;

                let pruneExtraArrivals = (ignoreSchedule: boolean) => {
                    _.forEach(arrivalEvents, (arriveEvent: EventLog) => {
                        let isWithinSchedule = arriveEvent.withinSchedule;
                        if ((ignoreSchedule || !isWithinSchedule) && pruneCount !== extraArrivals) {
                            _.pull(eventLogs, arriveEvent);
                            pruneCount++;
                        }
                    })
                };

                // first remove events outside schedule
                pruneExtraArrivals(false);
                // remove more within schedule if there still are too many arrival events
                pruneExtraArrivals(true);
            }

            return eventLogs;
        };

        taskEventLogs = removeNonReportEvents(taskEventLogs);
        taskEventLogs = preferArrivalsWithinSchedule(taskEventLogs);
        taskEventLogs = onlyWriteAcceptOnce(taskEventLogs);

        return taskEventLogs;
    }

    getData(report: Report): ReportData {

        const groupedTasks = this.tasksGroupedByHeader(report);
        const groupedEventLogs = this.eventLogsGroupedByHeader(report, groupedTasks);

        return {
            owner: report.owner,
            report: report,
            groupedTasks: groupedTasks,
            groupedEventLogs: groupedEventLogs
        };
    }

}