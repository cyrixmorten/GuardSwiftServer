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
        const client: Client = await eventLog.client.fetch({useMasterKey: true});
        eventLog.clientName = client.name;
        eventLog.clientCity = client.cityName;
        eventLog.clientZipcode = client.zipCode;
        eventLog.clientAddress = client.addressName;
        eventLog.clientAddressNumber = client.addressNumber;
        eventLog.clientFullAddress = `${client.addressName} ${client.addressNumber} ${client.zipCode} ${client.cityName}`;
    }

    if (!eventLog.automatic) {
        eventLog.automatic = false;
    }
});

Parse.Cloud.afterSave(EventLog, (request) => {

    const EventLog = <EventLog>request.object;

    return ReportHelper.writeEventToReport(EventLog);
});


