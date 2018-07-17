import {Dictionary} from "lodash";
import {Report} from "../../../shared/subclass/Report";
import {Task, TaskType} from "../../../shared/subclass/Task";
import {EventLog} from "../../../shared/subclass/EventLog";
import {RegularRaidReportDataProvider} from "./report/regular.raid.report.data.provider";
import {StaticReportDataProvider} from "./report/static.report.data.provider";

export type ReportData = {
    report: Report;
    groupedTasks: Dictionary<Task[]>; // each key is the header of the group
    groupedEventLogs: Dictionary<EventLog[]>; // each key is the objectId of task
};

export interface IReportDataProvider {
    getData(report: Report): ReportData;
}

export class ReportDataProvider implements IReportDataProvider {

    getData(report: Report): ReportData {
        let dataProvider: IReportDataProvider;
        if (report.matchingTaskType(TaskType.REGULAR, TaskType.RAID, TaskType.ALARM)) {
            dataProvider = new RegularRaidReportDataProvider();
        }
        if (report.matchingTaskType(TaskType.STATIC)) {
            dataProvider =  new StaticReportDataProvider();
        }

        if (!dataProvider) {
            throw 'No data provider for report';
        }

        return dataProvider.getData(report)
    }


}