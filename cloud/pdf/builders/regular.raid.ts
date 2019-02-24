import * as moment from 'moment-timezone';
import * as _ from 'lodash';
import { ReportSettings } from "../../../shared/subclass/ReportSettings";
import { EventLog, TaskEvent } from "../../../shared/subclass/EventLog";
import { Report } from "../../../shared/subclass/Report";
import { Task, TaskType } from "../../../shared/subclass/Task";
import { BaseReportBuilder } from "./base.builder";


export class RegularRaidReportBuilder extends BaseReportBuilder {


    constructor(report: Report, settings: ReportSettings, timeZone: string) {
        super(report, settings, timeZone);
    }

    // headerLogo(): Object {
    //     let headerLogo = this.settings.headerLogo;
    //
    //     if (!headerLogo) {
    //         return {}
    //     }
    //
    //     return {
    //         image: headerLogo.datauri,
    //         // margin: [15, 60, 15, 0],
    //         alignment: "center",
    //         width: headerLogo.stretch ? (21 / 2.54) * 72 - (2 * 40) : headerLogo.width, // (cm / 2.54) * dpi - margin
    //         height: headerLogo.height
    //     };
    // }

    private contentHeader(clientName: string, clientFullAddress: string): Object {
        return {
            stack: [
                {
                    text: clientName,
                    style: 'header'
                },
                {
                    text: clientFullAddress,
                    style: ['header', 'subHeader']
                }
            ],
            alignment: "center"
            // margin: [left, top, right, bottom]
            // margin: [50, 100, 50, 30]
        };
    }

    private contentReportId(reportId: string): Object {
        return {
            columns: [
                {
                    width: 'auto',
                    text: ''
                },
                {
                    width: '*',
                    text: [{text: 'Rapport id: ' + reportId, color: 'grey'}],
                    alignment: 'right'
                }
            ],
            margin: [0, 10],
            style: {bold: true}
        }
    }

    private contentEventTable(eventLogs: EventLog[], timeZone: string): Object {


        let tableHeader = (...headerText: string[]) => {
            return _.map(headerText, (header) => {
                return {text: header, style: 'tableHeader'}
            })
        };

        let tableContent = () => {

            const rows = [];

            const writtenEvents = _.filter(eventLogs, (eventLog) => eventLog.matchingTaskEvent(TaskEvent.OTHER));

            _.forEach(eventLogs, (eventLog: EventLog) => {

                rows.push([
                    eventLog.matchingTaskEvent(TaskEvent.ARRIVE) ? eventLog.guardInitials : '',
                    eventLog.matchingTaskEvent(TaskEvent.ARRIVE) ? moment(eventLog.deviceTimestamp).tz(timeZone).format('HH:mm') : '',
                    eventLog.event,
                    eventLog.amount || '',
                    eventLog.people,
                    eventLog.clientLocation
                ]);

                if (!_.isEmpty(eventLog.remarks)) {
                    rows.push(['', '', {text: eventLog.remarks, colSpan: 4, fillColor: '#eeeeee'}]);
                }
            });

            // Add default text if nothing is written

            if (_.isEmpty(writtenEvents)) {
                // TODO translate
                rows.push(['',
                    '',
                    {
                        text: "Ingen uregelmæssigheder blev observeret under tilsynet",
                        colSpan: 4,
                        fillColor: '#eeeeee'
                    }]);
            }

            return rows;
        };

        return {
            table: {
                widths: [30, 50, 75, 30, '*', '*'],
                headerRows: 1,
                body: [
                    tableHeader('Vagt', 'Tidspunkt', 'Hændelse', 'Antal', 'Personer', 'Placering'), // TODO translate
                    ...tableContent()
                ]
            },
            layout: 'headerLineOnly',
            // margin: [left, top, right, bottom]
            margin: [0, 0, 0, 10]
        }
    }

    content(): RegularRaidReportBuilder {

        let content = [
            this.headerLogo(),
            this.contentHeader(this.report.clientName, this.report.clientFullAddress),
            this.contentReportId(this.report.id)
        ];

        let taskTypeHeader = (task: Task) => {
            if (task.type) {
                return task.type;
            }

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

        let groupTasksByHeader = _.groupBy(this.report.tasks || [this.report.task], taskTypeHeader);

        // add event table for each task in report
        _.forOwn(groupTasksByHeader, (tasks: Task[], header: string) => {
            content.push(header);
            content.push(this.contentEventTable(this.organizeEvents(tasks), this.timeZone));
        });

        this.write({
            content: content
        });

        return this;
    }

    organizeEvents(tasks: Task[]): EventLog[] {

        let taskIds = _.map(tasks, (task: Task) => task.id);
        let taskEventLogs = _.filter(this.report.eventLogs, (eventLog) => _.includes(taskIds, eventLog.task.id));

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

            if (!this.report.isMatchingTaskType(TaskType.ALARM)) {
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
            if (!this.report.isMatchingTaskType(TaskType.REGULAR, TaskType.RAID)) {
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
        // taskEventLogs = preferArrivalsWithinSchedule(taskEventLogs);
        taskEventLogs = onlyWriteAcceptOnce(taskEventLogs);

        return _.sortBy(taskEventLogs, (eventLog: EventLog) => eventLog.deviceTimestamp);
    }


}





