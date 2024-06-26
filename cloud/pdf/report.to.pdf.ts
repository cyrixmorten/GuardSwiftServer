import {ReportSettings, ReportSettingsQuery} from "../../shared/subclass/ReportSettings";
import {Report, ReportQuery} from "../../shared/subclass/Report";
import HttpResponse = Parse.Cloud.HttpResponse;
import {TaskType} from "../../shared/subclass/Task";
import {RegularRaidReportBuilder} from "./builders/regular.raid";
import {IReportBuilder} from "./builders/base.builder";
import {StaticReportBuilder} from "./builders/static";

export class ReportToPDF {

    static async buildDoc(reportId: string, customerFacing: boolean, settings?: ReportSettings): Promise<Object> {

        if (!reportId) {
            throw new Error('buildDoc missing reportId');
        }

        let query = new ReportQuery().matchingId(reportId).build();

        query.include(Report._eventLogs);
        query.include(Report._tasks);
        query.include(Report._client); // used to determine if we should use alternative header

        // TODO: backwards compatibility
        // TODO: Create job that adds task to tasks array before removing this
        query.include(Report._task);


        try {
            let report: Report = await query.first({useMasterKey: true});

            let timeZone = report.owner.timeZone || 'Europe/Copenhagen';

            settings = settings ? settings : await new ReportSettingsQuery().matchingOwner(report.owner).matchingTaskType(report.taskType).build().first({useMasterKey: true});

            let reportBuilder: IReportBuilder;
            if (report.isMatchingTaskType(TaskType.REGULAR, TaskType.RAID, TaskType.ALARM)) {
                // TODO create dedicated alarm report
                reportBuilder = new RegularRaidReportBuilder(report, settings, timeZone, {
                    customerFacing,
                    showAllTimestamps: report.client.showAllTimestampsInReport
                });
            }
            if (report.isMatchingTaskType(TaskType.STATIC)) {
                reportBuilder = new StaticReportBuilder(report, settings, timeZone);
            }


            return reportBuilder.generate();
        } catch (e) {

            console.error(e);

            throw new Error(`Failed to build report with id: ${reportId}! ${JSON.stringify(e)}`);

        }

    }

    static async buildPdf(reportId: string, customerFacing: boolean, settings?: ReportSettings): Promise<Buffer> {

        if (!reportId) {
            throw new Error('buildPdf missing reportId');
        }

        try {
            let reportDoc: Object = await ReportToPDF.buildDoc(reportId, customerFacing, settings);
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





