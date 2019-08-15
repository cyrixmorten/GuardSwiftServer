import * as moment from 'moment-timezone';
import * as _ from 'lodash';
import { ReportSettings } from "../../../shared/subclass/ReportSettings";
import { EventLog, TaskEvent } from "../../../shared/subclass/EventLog";
import { Report } from "../../../shared/subclass/Report";
import { Task, TaskType } from "../../../shared/subclass/Task";
import { BaseReportBuilder } from "./base.builder";
import { ReportEventFilters } from '../report.event.filters';
import { ReportEventOrganizers } from '../report.event.organizers';
import { OneAcceptStrategy } from '../excluders/one.accept.strategy';
import { ExcludeOverlappingArrivalsStrategy } from '../excluders/overlapping.strategy';
import { PreferArrivalsWithinScheduleStrategy } from '../excluders/within.schedule.strategy';

export class RegularRaidReportBuilder extends BaseReportBuilder {


    constructor(report: Report, settings: ReportSettings, timeZone: string, private customerFacing: boolean) {
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
                    text: !this.customerFacing ? 'Rød tekst medtages ikke i rapporter til kunden' : '',
                    color: 'red', 
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

            const contentRows = _.flatMap(eventLogs, (eventLog) => {

                const createEventRow = () => {
                        const showInitials = eventLog.matchingTaskEvent(TaskEvent.ARRIVE);
                        const showTimeStamp = eventLog.matchingTaskEvent(TaskEvent.ARRIVE);
                        const internalTimeStamp = !showTimeStamp && !this.customerFacing;

                        return [
                            {text: showInitials ? eventLog.guardInitials : ''},
                            {
                                text: showTimeStamp || internalTimeStamp ? moment(eventLog.deviceTimestamp).tz(timeZone).format('HH:mm') : '',
                                color: internalTimeStamp ? 'red' : undefined
                            },
                            {text: _.upperFirst(eventLog.event)},
                            {text: eventLog.amount || '', alignment: 'center'},
                        ]
                }

                const createPeopleRow = () => {
                    return eventLog.people ? [{text: ''}, {text: ''}, {text: _.upperFirst(eventLog.people), colSpan: 2}] : undefined;
                }

                const createLocationRow = () => {
                    return eventLog.clientLocation ? [{text: ''}, {text: ''}, {text: _.upperFirst(eventLog.clientLocation), colSpan: 2}] : undefined;
                }

                const createRemarksRow = () => {
                    return eventLog.remarks ? [
                        {text: ''}, 
                        {text: ''}, 
                        {text: _.upperFirst(eventLog.remarks), colSpan: 2, fillColor: '#f2f2f2'}
                    ] : undefined;
                }

                const createExcludeReasonRow = () => {
                    return eventLog.isExcludedFromReport() ? [{text: ''}, {text: ''}, {text: _.upperFirst(eventLog.getExcludeReason()), colSpan: 2}] : undefined;
                }

                const eventRow = createEventRow();
                const peopleRow = createPeopleRow();
                const locationRow = createLocationRow();
                const remarksRow = createRemarksRow();
                const excludeReasonRow = createExcludeReasonRow();

                const allRows = _.compact(
                    (eventLog.isExcludedFromReport() && this.customerFacing) ? [] : [eventRow, peopleRow, locationRow, remarksRow, excludeReasonRow]
                );

                // remove border from all rows
                allRows.forEach((row) => {
                    row.forEach((entry) => {
                        _.assign(entry, {
                            border: [false, false, false, false],
                            color: eventLog.isExcludedFromReport() ? 'red' : entry.color,
                        })                        
                    });
                });

                // add border to last row for event
                const bottomMostRow = excludeReasonRow || remarksRow || locationRow || peopleRow || eventRow;
                for (let i = 2; i<bottomMostRow.length; i++) {
                    const entry = bottomMostRow[i];
                    _.assign(entry, {
                        border: [false, false, false, true]
                    })
                }

                return allRows;
            });

            const writtenEvents = _.filter(eventLogs, (eventLog) => eventLog.matchingTaskEvent(TaskEvent.OTHER));

            if (_.isEmpty(writtenEvents)) {
                // TODO translate
                contentRows.push([
                    {text: ''},
                    {text: ''},
                    {
                        text: "Ingen uregelmæssigheder blev observeret under tilsynet",
                        colSpan: 2,
                        border: [false, false, false, true]
                    } as any
                ]);
            }

            return contentRows;
        };

        return {
            table: {
                widths: [30, 50, '*', 35],
                headerRows: 1,
                body: [
                    tableHeader('Vagt', 'Tidspunkt', 'Hændelse', ''), // TODO translate
                    ...tableContent()
                ]
            },
            layout: 'lightHorizontalLines',
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

        // TODO: translate
        let taskTypeHeader = (taskType: TaskType) => {
            switch (taskType) {
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

        const allTasks = this.report.tasks || [this.report.task];
        const groupTasksByType = _.groupBy(allTasks, (task) => task.taskType);

        const organizedTaskEventsAcrossGroups = this.organizeEvents(this.report.eventLogs, allTasks);

        // add event table for each task in report
        _.forOwn(groupTasksByType, (tasks: Task[], taskType: TaskType) => {

            const organizedTaskGroupEvents = this.organizeEvents(organizedTaskEventsAcrossGroups, tasks);

            if (!_.isEmpty(ReportEventFilters.notExcludedEvents(organizedTaskGroupEvents))) {
                content.push(taskTypeHeader(taskType));
                content.push(this.contentEventTable(organizedTaskGroupEvents, this.timeZone));
            }
        });

        this.write({
            content: content
        });

        return this;
    }



    organizeEvents(eventLogs: EventLog[], tasks: Task[]): EventLog[] {

        const taskEventLogs = ReportEventOrganizers.sortByTime(ReportEventFilters.reportEventsMatchingTasks(eventLogs, tasks))

        const excludeStrategies = [
            new OneAcceptStrategy(this.timeZone),
            new ExcludeOverlappingArrivalsStrategy(this.timeZone),
            new PreferArrivalsWithinScheduleStrategy(this.timeZone)
        ];
        
        excludeStrategies.forEach((excludeStrategy) => {
            excludeStrategy.run(ReportEventFilters.notExcludedEvents(taskEventLogs), tasks);
        });

        return ReportEventOrganizers.moveFirstArrivalToTop(taskEventLogs);
    }


}