import * as moment from 'moment-timezone-all';
import * as _ from 'lodash';
import {Report} from "../../../shared/subclass/Report";
import {BasePDFMakeBuilder} from "./base.builder";
import {ReportToPDF} from "../report.to.pdf";
import {TaskGroupStarted} from "../../../shared/subclass/TaskGroupStarted";
import {Client} from '../../../shared/subclass/Client';
import {ReportDataProvider} from "../dataprovider/report.data.provider";


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
                const reportData = new ReportDataProvider().getData(report);

                return reportData.report.clientName;
            })
        ];


        this.write({
            content: content
        });

        return this;
    }

    // Query for reports
    public async generate() {

    }



}





