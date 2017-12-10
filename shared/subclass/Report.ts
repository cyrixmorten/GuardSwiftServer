import {QueryBuilder} from "../QueryBuilder";
import {EventLog} from "./EventLog";
import {Task, TaskType} from "./Task";
import {TaskGroupStarted} from "./TaskGroupStarted";

/**
 * When a new report is created it copies attributes from the eventlog that created the report, hence extending
 * EventLog
 */
export class Report extends EventLog {

    static readonly className = 'Report';

    static readonly _reportId = 'reportId';

    static readonly _taskGroups = 'taskGroups';
    static readonly _tasks = 'tasks';

    static readonly _eventLogs = 'eventLogs';




    constructor() {
        super(Report.className);
    }

    get eventLogs(): EventLog[] {
        return this.get(Report._eventLogs);
    }


}

export class ReportQuery extends QueryBuilder<Report> {

    constructor() {
        super(Report);
    }

    matchingReportId(reportId: string): ReportQuery {
        this.query.equalTo(Report._reportId, reportId);

        return this;
    }

    matchingTask(task: Task): ReportQuery {
        this.query.equalTo(Report._tasks, task);

        return this;
    }

    matchingTaskGroupStarted(taskGroup: TaskGroupStarted): ReportQuery {
        if (taskGroup) {
            this.query.equalTo(Report._taskGroups, taskGroup);
        }

        return this;
    }

    matchingTaskType(taskType: TaskType): ReportQuery {
        this.query.equalTo(Report._taskType, taskType);

        return this;
    }
}