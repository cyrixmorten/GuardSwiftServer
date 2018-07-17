import {IReportDataProvider, ReportData} from "./report.data.provider";
import {Report} from "../../../shared/subclass/Report";

export class StaticReportDataProvider implements IReportDataProvider {

    getData(report: Report): ReportData {

        return {
            report: report,
            groupedTasks: {},
            groupedEventLogs: {}
        };
    }

}