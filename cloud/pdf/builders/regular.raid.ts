import * as moment from 'moment-timezone-all';
import * as _ from 'lodash';
import {ReportSettings} from "../../../shared/subclass/ReportSettings";
import {EventLog, TaskEvent} from "../../../shared/subclass/EventLog";
import {Report} from "../../../shared/subclass/Report";
import {Task, TaskType} from "../../../shared/subclass/Task";
import {BaseReportBuilder} from "./base.builder";


export class RegularRaidReportBuilder extends BaseReportBuilder {


    constructor(report: Report, settings: ReportSettings, timeZone: string) {
        super(report, settings, timeZone);
    }

    // background(): RegularRaidReportBuilder {
    //     let headerLogo = this.settings.headerLogo;
    //
    //     if (headerLogo) {
    //
    //         this.write({
    //             background: {
    //                 image: headerLogo.datauri,
    //                 margin: [15, 60, 15, 0],
    //                 alignment: "center",
    //                 width: headerLogo.stretch ? (21 / 2.54) * 72 - (2 * 40) : headerLogo.width, // (cm / 2.54) * dpi - margin
    //                 height: headerLogo.height
    //             }
    //         });
    //     }
    //
    //
    //     return this;
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
            // margin: [left, top, right, bottom]
            margin: [50, 100, 50, 30]
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
            let rows = [];
            _.map(eventLogs, (eventLog: EventLog) => {
                rows.push([
                    eventLog.guardInitials,
                    moment(eventLog.deviceTimestamp).tz(timeZone).format('HH:mm'),
                    eventLog.event,
                    eventLog.amount || '',
                    eventLog.people,
                    eventLog.clientLocation
                ]);

                if (!_.isEmpty(eventLog.remarks)) {
                    rows.push(['', '', {text: eventLog.remarks, colSpan: 4, fillColor: '#eeeeee'}]);
                }
            });

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
            this.contentHeader(this.report.clientName, this.report.clientFullAddress),
            this.contentReportId(this.report.id)
        ];

        // add event table for each task in report
        _.forEach(this.report.tasks, (task: Task) => {
            let taskHeader = task.type || task.taskType;
            let taskEventLogs = this.organizeEvents(task);
            let taskEventTable = this.contentEventTable(taskEventLogs, this.timeZone);

            content.push(taskHeader);
            content.push(taskEventTable);
        });

        this.write({
            content: content
        });

        return this;
    }

    organizeEvents(task: Task): EventLog[] {

        let taskEventLogs = _.filter(this.report.eventLogs, (eventLog) => eventLog.task.id === task.id);

        let removeNonReportEvents = (eventLogs: EventLog[]): EventLog[] => {
            return _.filter(eventLogs, (eventLog: EventLog) => {
                if (task.taskType === TaskType.ALARM) {
                    return eventLog.matchingTaskEvent(TaskEvent.ACCEPT, TaskEvent.ARRIVE, TaskEvent.ABORT, TaskEvent.FINISH, TaskEvent.OTHER)
                }
                else {
                    return eventLog.matchingTaskEvent(TaskEvent.ARRIVE, TaskEvent.OTHER)
                }
            });
        };

        let onlyWriteAcceptOnce = (eventLogs: EventLog[]): EventLog[] => {

            if (!this.report.matchingTaskType(TaskType.ALARM)) {
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
        };

        let preferArrivalsWithinSchedule = (eventLogs: EventLog[]): EventLog[] => {
            if (!this.report.matchingTaskType(TaskType.REGULAR, TaskType.RAID)) {
                return eventLogs;
            }

            let targetSupervisions = task.supervisions;
            let arrivalEvents = _.filter(eventLogs, (eventLog: EventLog) => eventLog.taskEvent === TaskEvent.ARRIVE)

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

        // Bump arrivals to the top
        return _.orderBy(taskEventLogs, (eventLog: EventLog) => {
            return eventLog.matchingTaskEvent(TaskEvent.ARRIVE) ? 1 : 0;
        });
    }


}





