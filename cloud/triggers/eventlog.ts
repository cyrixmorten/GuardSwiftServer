import { EventLog } from "../../shared/subclass/EventLog";
import { Client } from '../../shared/subclass/Client';
import { BeforeSaveUtils } from './BeforeSaveUtils';
import { ReportHelper } from '../utils/ReportHelper';

Parse.Cloud.beforeSave(EventLog, async (request, response) => {
    BeforeSaveUtils.settUserAsOwner(request);

    const eventLog = <EventLog>request.object;

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

    response.success();


});

Parse.Cloud.afterSave(EventLog, (request) => {

    const EventLog = <EventLog>request.object;

    return ReportHelper.writeEventToReport(EventLog);
});


