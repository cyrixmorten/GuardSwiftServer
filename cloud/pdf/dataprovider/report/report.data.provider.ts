import {Dictionary} from "lodash";
import {Report, ReportQuery} from "../../../../shared/subclass/Report";
import {Task, TaskType} from "../../../../shared/subclass/Task";
import {EventLog} from "../../../../shared/subclass/EventLog";
import {RegularRaidReportDataProvider} from "./regular.raid.report.data.provider";
import {StaticReportDataProvider} from "./static.report.data.provider";
import {User} from "../../../../shared/subclass/User";

export type ReportData = {
    owner: User;
    report: Report;
    groupedTasks: Dictionary<Task[]>; // each key is the header of the group
    groupedEventLogs: Dictionary<EventLog[]>; // each key is the objectId of task
};

export interface IReportDataProvider {
    getData(report: Report): ReportData;
}

export class ReportDataProvider {

    async getDataFromId(reportId: string): Promise<ReportData> {

        // TODO: backwards compatibility
        // TODO: Create job that adds task to tasks array before removing this
        let report = await new ReportQuery()
            .include(Report._owner, Report._eventLogs, Report._tasks, Report._task)
            .matchingId(reportId)
            .build()
            .first({useMasterKey: true});

        return this.getData(report);
    }

    getData(report: Report): ReportData {

        let dataProvider: IReportDataProvider;
        if (report.matchingTaskType(TaskType.REGULAR, TaskType.RAID, TaskType.ALARM)) {
            console.log('regular');
            dataProvider = new RegularRaidReportDataProvider();
        }
        if (report.matchingTaskType(TaskType.STATIC)) {
            console.log('static');
            dataProvider =  new StaticReportDataProvider();
        }

        if (!dataProvider) {
            throw 'No data provider for report';
        }

        return dataProvider.getData(report)
    }


}