import * as moment from 'moment-timezone-all';
import * as _ from 'lodash';
import {ReportSettings} from "../../../shared/subclass/ReportSettings";
import {EventLog} from "../../../shared/subclass/EventLog";
import {Report} from "../../../shared/subclass/Report";
import {BasePDFMakeBuilder} from "./base.builder";


export class StaticReportBuilder extends BasePDFMakeBuilder {


    constructor(private timeZone: string, private report: Report, private reportSettings?: ReportSettings) {
        super();
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
            margin: [50, 40, 50, 30]
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
                    moment(eventLog.deviceTimestamp).tz(timeZone).format('HH:mm'),
                    eventLog.remarks
                ]);
            });

            return rows;
        };

        return {
            table: {
                widths: [50, '*'],
                body: [
                    ...tableContent()
                ]
            },
            layout: 'noBorders',
            // margin: [left, top, right, bottom]
            margin: [0, 0, 0, 10]
        }
    }

    // TODO: incorporate in header as is done in regular.raid to prevent text overlap when taking more than 1 page
    background(): StaticReportBuilder {
        if (this.reportSettings) {
            this.write({
                background: this.headerLogo(this.reportSettings.headerLogo)
            });
        }

        return this;
    }

    content(): StaticReportBuilder {

        let content = [
            this.contentHeader(this.report.clientName, this.report.clientFullAddress),
            this.contentReportId(this.report.id),
            this.contentEventTable(this.report.eventLogs, this.timeZone)
        ];

        this.write({
            content: content
        });

        return this;
    }

    generate(): Object {
        // TODO translate
        return this.header(
            [{text: 'Vagt: ', bold: true}, this.report.guardName],
            'Dato: ' + moment(this.report.createdAt).tz(this.timeZone).format('DD-MM-YYYY'))
            .background()
            .content()
            .footer()
            .styles()
            .build();
    }


}





