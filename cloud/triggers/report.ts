import { Report } from '../../shared/subclass/Report';
import { Client } from '../../shared/subclass/Client';
import BeforeSaveRequest = Parse.Cloud.BeforeSaveRequest;
import { BeforeSave } from './BeforeSave';

Parse.Cloud.beforeSave(Report, async (request: BeforeSaveRequest, response) => {
    BeforeSave.setArchiveFalse(request);
    BeforeSave.settUserAsOwner(request);

    let report = <Report>request.object;

    report.isClosed = report.has(Report._isClosed) ? report.isClosed: false;
    if (!report.has(Report._isSent)) {
        report.isSent =  report.isSent || report.has(Report._mailStatus);
    }

    if (report.client && !report.has(Report._clientName)) {
        const client: Client = await report.client.fetch({useMasterKey: true});
        report.clientName = client.name;
        report.clientAddress = client.addressName;
        report.clientAddressNumber = client.addressNumber;
        report.clientFullAddress = `${client.addressName} ${client.addressNumber} ${client.zipCode} ${client.cityName}`;
    }

    response.success();
});