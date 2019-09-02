import { EventLog } from "../../shared/subclass/EventLog";
import { Client } from '../../shared/subclass/Client';
import { ReportHelper } from '../utils/ReportHelper';
import { BeforeSave } from './BeforeSave';
import * as parse from "parse";

Parse.Cloud.beforeSave(EventLog, async (request: parse.Cloud.BeforeSaveRequest) => {
    BeforeSave.setArchiveFalse(request);
    BeforeSave.settUserAsOwner(request);

    const eventLog = request.object as EventLog;

    if (eventLog.client) {
        eventLog.client = await eventLog.client.fetch({useMasterKey: true});
    }

    if (!eventLog.automatic) {
        eventLog.automatic = false;
    }
});

Parse.Cloud.afterSave(EventLog, (request) => {

    const EventLog = <EventLog>request.object;

    return ReportHelper.writeEventToReport(EventLog);
});


