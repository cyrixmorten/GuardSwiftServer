import * as moment from 'moment-timezone-all';
import * as _ from 'lodash';
import {ReportSettings} from "../../../shared/subclass/ReportSettings";
import {EventLog, TaskEvent} from "../../../shared/subclass/EventLog";
import {Report} from "../../../shared/subclass/Report";
import {Task, TaskType} from "../../../shared/subclass/Task";
import {BaseReportBuilder} from "./base.builder";
import {ReportToPDF} from "../report.to.pdf";


export class DailyTaskGroupsSummaryReportBuilder extends BaseReportBuilder {



    constructor(timeZone: string, private reports: Report[]) {
        super(timeZone, {
            showFooter: false,
            showGuardName: false
        });

        // use first report to set header date
        this.setReport(_.first(reports));
    }



    private contentHeader(): Object {
        return {
            stack: [
                {
                    text: 'Kreds oversigt', // TODO translate
                    style: 'header'
                },
            ],
            alignment: "center"
        };
    }



    content(): DailyTaskGroupsSummaryReportBuilder {

        let content = [
            this.contentHeader(),
            ..._.map(this.reports, (report: Report) => {
                return ReportToPDF.reportBuilder(this.timeZone, report).content();
            })
        ];


        this.write({
            content: content
        });

        return this;
    }




}





