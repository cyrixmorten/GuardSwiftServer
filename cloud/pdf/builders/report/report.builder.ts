import {BasePDFMakeBuilder, IPdfMakeBuilder} from "../base.builder";
import {ReportData} from "../../dataprovider/report/report.data.provider";
import {ReportSettings} from "../../../../shared/subclass/ReportSettings";
import {Report} from "../../../../shared/subclass/Report";
import {StaticReportBuilder} from "./static.report.builder";
import {RegularRaidReportBuilder} from "./regular.raid.report.builder";
import {TaskType} from "../../../../shared/subclass/Task";

export interface IReportPdfMakeBuilder extends IPdfMakeBuilder {
    content(reportData: ReportData): BasePDFMakeBuilder;
    generate(reportData: ReportData): Object;
}

export class ReportBuilder extends BasePDFMakeBuilder {

    constructor(private timeZone: string, private settings?: ReportSettings) {
        super();
    }

    getBuilder(report: Report): IReportPdfMakeBuilder {
        if (report.matchingTaskType(TaskType.REGULAR, TaskType.RAID, TaskType.ALARM)) {
            // TODO create dedicated alarm report
            return new RegularRaidReportBuilder(this.timeZone, this.settings);
        }
        if (report.matchingTaskType(TaskType.STATIC)) {
            return new StaticReportBuilder(this.timeZone, this.settings);
        }

        throw new Error("Missing builder for report")
    }

    generate(reportData: ReportData): Object {
        return this.getBuilder(reportData.report).generate(reportData)
    }
}