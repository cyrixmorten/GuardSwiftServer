import * as moment from 'moment-timezone-all';
import * as _ from 'lodash';
import {IHeaderLogo, ReportSettings} from "../../../shared/subclass/ReportSettings";
import {EventLog, TaskEvent} from "../../../shared/subclass/EventLog";
import {Task} from "../../../shared/subclass/Task";
import {BasePDFMakeBuilder} from "./base.builder";
import {ReportData} from "../dataprovider/report.data.provider";



export class RegularRaidReportBuilder extends BasePDFMakeBuilder {



    constructor(private timeZone: string, private reportSettings: ReportSettings, private reportData: ReportData) {
        super();
    }

    headerLogo(): Object {

        if (!this.reportSettings) {
            return;
        }

        let headerKey: keyof ReportSettings = 'headerLogo';
        let headerLogo = _.get<IHeaderLogo>(this.reportSettings, headerKey);

        if (!headerLogo) {
            return {}
        }

        return {
            image: headerLogo.datauri,
            // margin: [15, 60, 15, 0],
            alignment: "center",
            width: headerLogo.stretch ? (21 / 2.54) * 72 - (2 * 40) : headerLogo.width, // (cm / 2.54) * dpi - margin
            height: headerLogo.height
        };
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

    private contentEventTable(eventLogs: EventLog[]): Object {


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
                    !eventLog.matchingTaskEvent(TaskEvent.OTHER) ? eventLog.formattedDeviceTimestamp(this.timeZone) : '',
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
            let writtenEvents = _.filter(eventLogs, (eventLog) => eventLog.matchingTaskEvent(TaskEvent.OTHER));
            if (writtenEvents.length === 0) {
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
            margin: [0, 0, 0, 10],
            unbreakable: false
        }
    }

    content(): RegularRaidReportBuilder {

        let content = _.compact([
            this.headerLogo(),
            this.contentHeader(this.reportData.report.clientName, this.reportData.report.clientFullAddress),
            this.contentReportId(this.reportData.report.id)
        ]);

        const groupedTasksByHeader = this.reportData.groupedTasks;
        const groupedEventLogsByHeader = this.reportData.groupedEventLogs;

        // add event table for each task in report
        _.forOwn(groupedTasksByHeader, (tasks: Task[], header: string) => {
            content.push(header);
            content.push(this.contentEventTable(groupedEventLogsByHeader[header]));
        });

        this.write({
            content: content
        });

        return this;
    }



    generate(): Object {
        // TODO translate
        return this.header(
            [{text: 'Vagt: ', bold: true}, this.reportData.report.guardName],
                    'Dato: ' + moment(this.reportData.report.createdAt).tz(this.timeZone).format('DD-MM-YYYY'))
            .background()
            .content()
            .footer()
            .styles()
            .build();
    }

}





