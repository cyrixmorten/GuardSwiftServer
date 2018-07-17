import * as moment from 'moment-timezone-all';
import * as _ from 'lodash';
import {Report} from "../../../../shared/subclass/Report";
import {BasePDFMakeBuilder} from "../base.builder";
import {TaskGroupStarted} from "../../../../shared/subclass/TaskGroupStarted";
import {Client} from '../../../../shared/subclass/Client';
import {ReportData, ReportDataProvider} from "../../dataprovider/report/report.data.provider";
import {IReportPdfMakeBuilder, ReportBuilder} from "../report/report.builder";


export class DailyTaskGroupsSummaryReportBuilder extends BasePDFMakeBuilder {



    constructor(private timeZone: string, private taskGroupStarted: TaskGroupStarted) {
        super();

    }

    private contentHeader(groupName: string): Object {
        return {
            stack: [
                {
                    text: 'Kreds oversigt: ' + groupName, // TODO translate
                    style: 'header'
                },
            ],
            alignment: "center"
        };
    }



    content(client?: Client, reports?: Report[]): DailyTaskGroupsSummaryReportBuilder {

        let content = [
            this.contentHeader(this.taskGroupStarted.name),
            ..._.map(reports, (report: Report) => {
                const reportBuilder: IReportPdfMakeBuilder = new ReportBuilder(this.timeZone).getBuilder(report);

                const reportData: ReportData = new ReportDataProvider().getData(report);

                return reportBuilder.content(reportData);
            })
        ];


        this.write({
            content: content
        });

        return this;
    }

    // Query for reports
    public async generate() {
        // TODO translate
        return this.header(
            [],
            'Dato: ' + moment(this.taskGroupStarted.createdAt).tz(this.timeZone).format('DD-MM-YYYY'))
            .background()
            .content()
            .footer()
            .styles()
            .build();
    }



}





