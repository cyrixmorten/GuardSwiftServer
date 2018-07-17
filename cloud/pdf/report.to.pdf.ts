import {ReportSettings, ReportSettingsQuery} from "../../shared/subclass/ReportSettings";
import {Report, ReportQuery} from "../../shared/subclass/Report";
import HttpResponse = Parse.Cloud.HttpResponse;
import {TaskType} from "../../shared/subclass/Task";
import {RegularRaidReportBuilder} from "./builders/report/regular.raid.report.builder";
import {IPdfMakeBuilder} from "./builders/base.builder";
import {StaticReportBuilder} from "./builders/report/static.report.builder";

import * as _ from 'lodash';
import {RegularRaidReportDataProvider} from "./dataprovider/report/regular.raid.report.data.provider";
import {IReportDataProvider, ReportData, ReportDataProvider} from "./dataprovider/report/report.data.provider";
import {StaticReportDataProvider} from "./dataprovider/report/static.report.data.provider";
import {ReportBuilder} from "./builders/report/report.builder";

export class ReportToPDF {

    static generatePDFDoc(report: Report, timeZone: string, settings: ReportSettings) {
        const reportData: ReportData = new ReportDataProvider().getData(report);

        return new ReportBuilder(timeZone, settings).generate(reportData);
    }

    static async fetchReportAndGeneratePDFDoc(reportId: string, settings?: ReportSettings): Promise<Object> {
        if (!reportId) {
            throw new Error('buildDoc missing reportId');
        }

        try {
            const reportData: ReportData = await new ReportDataProvider().getDataFromId(reportId);

            const timeZone = reportData.owner.timeZone || 'Europe/Copenhagen';
            settings = settings ? settings : await new ReportSettingsQuery().matchingOwner(reportData.owner)
                .matchingTaskType(reportData.report.taskType).build().first({useMasterKey: true});

            return new ReportBuilder(timeZone, settings).generate(reportData);
        } catch (e) {

            console.error(e);

            throw new Error(`Failed to build report with id: ${reportId}! ${JSON.stringify(e)}`);

        }

    }

    static async fetchReportAndGeneratePDF(reportId, settings?: ReportSettings): Promise<Buffer> {

        if (!reportId) {
            throw new Error('buildPdf missing reportId');
        }

        try {
            const reportDoc: Object = await ReportToPDF.fetchReportAndGeneratePDFDoc(reportId, settings);

            let httpResponse: HttpResponse = await ReportToPDF.generatePDF(reportDoc);

            return httpResponse.buffer;
        } catch (e) {
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





