import * as moment from 'moment-timezone';
import * as _ from 'lodash';
import {ReportSettings} from "../../../shared/subclass/ReportSettings";
import {EventLog, TaskEvent} from "../../../shared/subclass/EventLog";
import {Report} from "../../../shared/subclass/Report";
import {Task, TaskType} from "../../../shared/subclass/Task";
import {BaseReportBuilder} from "./base.builder";
import {ReportEventFilters} from '../report.event.filters';
import {ReportEventOrganizers} from '../report.event.organizers';
import {OneAcceptStrategy} from '../excluders/one.accept.strategy';
import {ExcludeOverlappingArrivalsStrategy} from '../excluders/overlapping.strategy';
import {PreferArrivalsWithinScheduleStrategy} from '../excluders/within.schedule.strategy';
import {EXCLUDE_MODE} from "../excluders/exclude.strategy";
import {ExcludeIdenticalStrategy} from "../excluders/exclude.identical.strategy";

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
                return {text: header, style: 'tableHeader', margin: [0, 1], border: [false, false, false, false]}
            })
        };

        let tableContent = () => {

            const contentRows = _.flatMap(eventLogs, (eventLog, index) => {

                const createEventRow = () => {

                    const createInitialsEntry = () => {

                        const showInitials = eventLog.matchingTaskEvent(TaskEvent.ARRIVE);
                        const internalInitials = !showInitials && !this.customerFacing;

                        return {
                            text: showInitials || internalInitials ? eventLog.guardInitials : '',
                            color: internalInitials ? 'red' : undefined
                        }
                    }

                    const createTimestampEntry = () => {

                        const isArrivalEvent = eventLog.matchingTaskEvent(TaskEvent.ARRIVE);
                        const internalTimeStamp = !isArrivalEvent && !this.customerFacing;

                        const showTimeStamp = isArrivalEvent || internalTimeStamp;
                        const showManualAutomatic = isArrivalEvent && !this.customerFacing;

                        const timeStamp = moment(eventLog.deviceTimestamp).tz(timeZone).format('HH:mm');
                        const manualAutomatic = eventLog.automatic ? 'A' : 'M';

                        return {
                            text: _.compact([
                                {
                                    text: showTimeStamp ? timeStamp : '',
                                    color: internalTimeStamp ? 'red' : undefined
                                },
                                showManualAutomatic ? ' ' : '',
                                {
                                    text: showManualAutomatic ? manualAutomatic : '',
                                    color: 'red'
                                },
                            ])
                        }
                    }

                    const createEventEntry = () => {
                        const isArrivalEvent = eventLog.matchingTaskEvent(TaskEvent.ARRIVE);
                        const isMerged = eventLog.isMerged;

                        if (isArrivalEvent && !isMerged) {
                            const nextEvent = eventLogs[index + 1];
                            const noWrittenEntries = !nextEvent?.matchingTaskEvent(TaskEvent.OTHER);

                            if (noWrittenEntries) {
                                return {
                                    text: "Ingen uregelmæssigheder blev observeret under tilsynet"
                                }
                            }
                        }

                        return {
                            text: !isArrivalEvent || isMerged ? _.upperFirst(eventLog.event) : ""
                        }
                    }

                    return eventLog.event !== "Andet" ? [
                        createInitialsEntry(),
                        createTimestampEntry(),
                        createEventEntry(),
                        {text: eventLog.amount || '', alignment: 'center'},
                    ] : undefined
                }

                const createPeopleRow = () => {
                    return eventLog.people ? [{text: ''}, {text: ''}, {
                        text: _.upperFirst(eventLog.people),
                        colSpan: 2
                    }] : undefined;
                }

                const createLocationRow = () => {
                    return eventLog.clientLocation ? [{text: ''}, {text: ''}, {
                        text: _.upperFirst(eventLog.clientLocation),
                        colSpan: 2
                    }] : undefined;
                }

                const createRemarksRow = () => {
                    return eventLog.remarks ? [
                        {text: ''},
                        {text: ''},
                        {text: _.upperFirst(eventLog.remarks), colSpan: 2, fillColor: '#f2f2f2'}
                    ] : undefined;
                }

                const createExcludeReasonRow = () => {
                    return eventLog.isExcludedFromReport() ? [{text: ''}, {text: ''}, {
                        text: _.upperFirst(eventLog.getExcludeReason()),
                        colSpan: 2
                    }] : undefined;
                }

                const eventRow = createEventRow();
                const peopleRow = createPeopleRow();
                const locationRow = createLocationRow();
                const remarksRow = createRemarksRow();
                const excludeReasonRow = createExcludeReasonRow();

                const allRowsForThisEvent = _.compact(
                    (eventLog.isExcludedFromReport() && this.customerFacing) ? [] : [eventRow, peopleRow, locationRow, remarksRow, excludeReasonRow]
                );

                const eventRowSpan = allRowsForThisEvent.length;
                

                // remove border from all rows
                allRowsForThisEvent.forEach((row, index) => {
                    
                    const addSeparatorLineTop = eventLog.matchingTaskEvent(TaskEvent.ARRIVE) && !eventLog.isExcludedFromReport();
                    const addSeparatorLineBottom = index === eventRowSpan - 1; 

                    row.forEach((entry) => {
                        _.assign(entry, {
                            margin: [0, addSeparatorLineTop ? 5 : 0, 0, 0],
                            border: [false, addSeparatorLineTop, false, addSeparatorLineBottom],
                            color: eventLog.isExcludedFromReport() ? 'red' : undefined,
                        })
                    });
                });

                return allRowsForThisEvent;
            });


            return contentRows;
        };

        return {
            table: {
                widths: [30, 60, '*', 35],
                headerRows: 1,
                body: [
                    tableHeader('Vagt', 'Ankommet', 'Hændelse', ''), // TODO translate
                    ...tableContent()
                ]
            },
            layout: 'regularRaid',
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
        const allEventLogs = this.report.eventLogs;

        const groupTasksByType = _.groupBy(allTasks, (task) => task.taskType);

        // add event table for each task in report
        _.forOwn(groupTasksByType, (tasks: Task[], taskType: TaskType) => {

            const organizedTaskGroupEvents = this.organizeEvents(allEventLogs, tasks);
            const expectedSupervisions = _.sumBy(tasks, (task: Task) => task.supervisions);

            if (!_.isEmpty(ReportEventFilters.notExcludedEvents(organizedTaskGroupEvents))) {
                content.push({
                    text: [
                        taskTypeHeader(taskType),
                        {
                            text: !this.customerFacing ? ` - forventet antal tilsyn: ${expectedSupervisions}` : '',
                            color: 'red'
                        }
                    ]
                });
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
            new ExcludeIdenticalStrategy(this.timeZone),
            new ExcludeOverlappingArrivalsStrategy(this.timeZone),
            new PreferArrivalsWithinScheduleStrategy(this.timeZone),
        ];


        const groupEventByGuard = _.groupBy(taskEventLogs, (event) => event.guard.id);

        // Do per-guard exclusion of arrivals
        _.forEach(groupEventByGuard, (events) => {
            excludeStrategies.forEach((excludeStrategy) => {
                excludeStrategy.run({
                    eventLogs: ReportEventFilters.notExcludedEvents(events),
                    tasks,
                    mode: EXCLUDE_MODE.GUARD
                });
            });


            const firstIncludedArrival = _.find(events, (event) => event.matchingTaskEvent(TaskEvent.ARRIVE) && !event.getExcludeReason());

            if (firstIncludedArrival) {
                firstIncludedArrival.setIncludeReason("Første ankomst for denne vægter");
            }
        });



        // Final sweep across all events
        excludeStrategies.forEach((strategy) => {
            strategy.run(         {
                eventLogs: ReportEventFilters.notExcludedEvents(taskEventLogs),
                tasks,
                mode: EXCLUDE_MODE.ALL
            })
        })

        const organizedEvents = ReportEventOrganizers.moveFirstArrivalToTop(taskEventLogs);
        const mergedEvents = ReportEventOrganizers.mergeArrivalWithFirstOther(organizedEvents);

        return mergedEvents;
    }


}