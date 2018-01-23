import * as moment from 'moment-timezone-all';
import * as _ from 'lodash';
import {IHeaderLogo, ReportSettings, ReportSettingsQuery} from "../../shared/subclass/ReportSettings";
import {EventLog, TaskEvent} from "../../shared/subclass/EventLog";
import {Report, ReportQuery} from "../../shared/subclass/Report";
import {ReportUtils} from "./reportUtils";
import HttpResponse = Parse.Cloud.HttpResponse;
import {Task, TaskType} from "../../shared/subclass/Task";


export class ReportBuilder {

    private reportDefinition = {};

    constructor() {

        this.write({
            pageMargins: [40, 60, 40, 60]
        })

    }

    private write(object: Object) {
        _.assignIn(this.reportDefinition, object);
    }


    // TODO translate
    header(guardName: string, date: Date, timeZone: string): ReportBuilder {
        this.write({
            header: {
                columns: [
                    {
                        width: 'auto',
                        text: [{text: 'Vagt: ', bold: true}, guardName]
                    },
                    {
                        width: '*',
                        text: 'Dato: ' + moment(date).tz(timeZone).format('DD-MM-YYYY'),
                        alignment: 'right'
                    }
                ],
                margin: [10, 10]
            }
        });

        return this;
    }

    background(headerLogo: IHeaderLogo): ReportBuilder {
        if (headerLogo) {

            this.write({
                background: {
                    image: headerLogo.datauri,
                    margin: [15, 60, 15, 0],
                    alignment: "center",
                    width: headerLogo.stretch ? (21 / 2.54) * 72 - (2 * 40) : headerLogo.width, // (cm / 2.54) * dpi - margin
                    height: headerLogo.height
                }
            });
        }


        return this;
    }

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
                    rows.push(['','', {text: eventLog.remarks, colSpan: 4, fillColor: '#eeeeee'}]);
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

    content(report: Report, timeZone: string): ReportBuilder {

        let content = [
            this.contentHeader(report.clientName, report.clientFullAddress),
            this.contentReportId(report.id)
        ];

        // add event table for each task in report
        _.forEach(report.tasks, (task: Task) => {
            let taskHeader = task.type || task.taskType;
            let taskEventLogs = this.organizeEvents(report, task);
            let taskEventTable = this.contentEventTable(taskEventLogs, timeZone);

            content.push(taskHeader);
            content.push(taskEventTable);
        });

        this.write({
            content: content
        });

        return this;
    }

    organizeEvents(report: Report, task: Task) : EventLog[] {

        let taskEventLogs = _.filter(report.eventLogs, (eventLog) => eventLog.task.id === task.id);

        let removeNonReportEvents = (eventLogs: EventLog[]): EventLog[] => {
            return _.filter(eventLogs, (eventLog: EventLog) => {
                if (task.taskType === TaskType.ALARM) {
                    return eventLog.matchingTaskEvent(TaskEvent.ACCEPT, TaskEvent.ARRIVE, TaskEvent.ABORT, TaskEvent.FINISH, TaskEvent.OTHER)
                } else {
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
        };

        let preferArrivalsWithinSchedule = (eventLogs: EventLog[]): EventLog[] => {
            if (!report.matchingTaskType(TaskType.REGULAR, TaskType.RAID)) {
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

        return taskEventLogs;
    }

    // TODO: Hardcoded, read from reportSettings
    footer(): ReportBuilder {
        this.write({
            footer: [
                {text: 'YDERLIGERE OPLYSNINGER PÅ TLF. 86 10 49 50', alignment: 'center'},
                {
                    text: 'Rapporten er genereret af GuardSwift - elektroniske vagtrapporter via smartphones',
                    alignment: 'center'
                }
            ]
        });

        return this;
    }

    styles(): ReportBuilder {
        this.write({
            styles: {
                header: {
                    fontSize: 22,
                    bold: true,
                    alignment: 'center'
                },
                subHeader: {
                    fontSize: 16,
                    color: 'grey'
                },
                tableHeader: {
                    bold: true,
                    fontSize: 11,
                    color: 'black'
                },
                boldFont: {
                    bold: true
                }
            }
        });

        return this;
    }

    build = (): Object => this.reportDefinition;

    static async buildDoc(reportId: string, settings?: ReportSettings): Promise<Object> {

        if (!reportId) {
            throw new Error('buildDoc missing reportId');
        }

        let query = new ReportQuery().matchingId(reportId).build();

        query.include(Report._eventLogs);
        query.include(Report._tasks);


        try {
            let report: Report = await query.first({useMasterKey: true});

            let timeZone = report.owner.timeZone || 'Europe/Copenhagen';

            settings = settings ? settings : await new ReportSettingsQuery().matchingOwner(report.owner).matchingTaskType(report.taskType).build().first({useMasterKey: true});

            return new ReportBuilder()
                .header(report.guardName, report.createdAt, timeZone)
                .background(settings.headerLogo)
                .content(report, timeZone)
                .footer()
                .styles()
                .build();

        } catch (e) {

            console.error(e);

            throw new Error(`Failed to build report with id: ${reportId}! ${JSON.stringify(e)}`);

        }

    }

    static async buildPdf(reportId, settings?: ReportSettings): Promise<Buffer> {

        if (!reportId) {
            throw new Error('buildPdf missing reportId');
        }

        try {
            let reportDoc: Object = await ReportBuilder.buildDoc(reportId, settings);
            let httpResponse: HttpResponse = await ReportUtils.generatePDF(reportDoc);

            return httpResponse.buffer;
        } catch(e) {
            throw new Error('Error during PDF creation' + JSON.stringify(e))
        }
    }
}





