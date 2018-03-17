import * as moment from 'moment-timezone-all';
import * as _ from 'lodash';
import {Report} from "../../../shared/subclass/Report";
import {BasePDFMakeBuilder} from "./base.builder";
import {ReportToPDF} from "../report.to.pdf";
import {TaskGroupStarted} from "../../../shared/subclass/TaskGroupStarted";
import {Client} from '../../../shared/subclass/Client';


export class DailyTaskGroupsSummaryReportBuilder extends BasePDFMakeBuilder {



    constructor(private timeZone: string) {
        super();

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



    content(client?: Client, reports?: Report[]): DailyTaskGroupsSummaryReportBuilder {

        let content = [
            this.contentHeader(),
            ..._.map(reports, (report: Report) => {
                return ReportToPDF.reportBuilder(this.timeZone, report).content();
            })
        ];


        this.write({
            content: content
        });

        return this;
    }

    // Query for reports
    public async buildForTaskGroupStarted(taskGroupStarted: TaskGroupStarted) {

    }



}





