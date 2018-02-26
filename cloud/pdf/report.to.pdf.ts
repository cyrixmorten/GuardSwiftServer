import {ReportSettings, ReportSettingsQuery} from "../../shared/subclass/ReportSettings";
import {Report, ReportQuery} from "../../shared/subclass/Report";
import HttpResponse = Parse.Cloud.HttpResponse;
import {TaskType} from "../../shared/subclass/Task";
import {RegularRaidReportBuilder} from "./builders/regular.raid";
import {IReportBuilder} from "./builders/base.builder";
import {StaticReportBuilder} from "./builders/static";

import * as _ from 'lodash';

export class ReportToPDF {

    static reportBuilder(timeZone: string, report: Report, settings?: ReportSettings): IReportBuilder {
        let reportBuilder: IReportBuilder;
        if (report.matchingTaskType(TaskType.REGULAR, TaskType.RAID, TaskType.ALARM)) {
            // TODO create dedicated alarm report
            reportBuilder = new RegularRaidReportBuilder(timeZone, report, settings);
        }
        if (report.matchingTaskType(TaskType.STATIC)) {
            reportBuilder = new StaticReportBuilder(timeZone, report, settings);
        }


        if (_.isUndefined(reportBuilder)) {
            throw new Error("Missing builder for report")
        }

        return reportBuilder;
    }

    static async buildDoc(reportId: string, settings?: ReportSettings): Promise<Object> {

        if (!reportId) {
            throw new Error('buildDoc missing reportId');
        }

        try {
            // TODO: backwards compatibility
            // TODO: Create job that adds task to tasks array before removing this
            let report = await new ReportQuery()
                            .include(Report._owner, Report._eventLogs, Report._tasks, Report._task)
                            .matchingId(reportId)
                            .build()
                            .first({useMasterKey: true});

            let timeZone = report.owner.timeZone || 'Europe/Copenhagen';

            settings = settings ? settings : await new ReportSettingsQuery().matchingOwner(report.owner).matchingTaskType(report.taskType).build().first({useMasterKey: true});

            return ReportToPDF.reportBuilder(timeZone, report, settings).generate();
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
            let reportDoc: Object = await ReportToPDF.buildDoc(reportId, settings);
            let httpResponse: HttpResponse = await this.generatePDF(reportDoc);

            return httpResponse.buffer;
        } catch(e) {
            throw new Error('Error during PDF creation' + JSON.stringify(e))
        }
    }

    static async generatePDF(docDefinition): Promise<HttpResponse> {

        return Parse.Cloud.httpRequest({
            method: 'POST',
            url: process.env.APP_URL + '/api/pdfmake',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: docDefinition
        })
    };
}





