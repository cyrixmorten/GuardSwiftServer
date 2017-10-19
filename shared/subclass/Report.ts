import {QueryBuilder} from "../QueryBuilder";
import {EventLog} from "./EventLog";
import {TaskType} from "./Task";

/**
 * When a new report is created it copies attributes from the eventlog that created the report, hence extending
 * EventLog
 */
export class Report extends EventLog {

    static readonly className = 'Report';

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



}