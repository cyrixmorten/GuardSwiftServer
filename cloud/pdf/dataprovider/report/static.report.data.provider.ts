import {IReportDataProvider, ReportData} from "./report.data.provider";
import {Report} from "../../../../shared/subclass/Report";

export class StaticReportDataProvider implements IReportDataProvider {

    getData(report: Report): ReportData {

        return {
            owner: report.owner,
            report: report,
            groupedTasks: {},
            groupedEventLogs: {}
        };
    }

}