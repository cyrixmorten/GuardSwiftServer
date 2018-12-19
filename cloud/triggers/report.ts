import { Report } from '../../shared/subclass/Report';
import { Client } from '../../shared/subclass/Client';

Parse.Cloud.beforeSave(Report,  async (request, response) => {
    let report = <Report>request.object;

    if (report.client) {
        const client: Client = await report.client.fetch({useMasterKey: true});
        report.clientName = client.name;
        report.clientAddress = client.addressName;
        report.clientAddressNumber = client.addressNumber;
        report.clientFullAddress = `${client.addressName} ${client.addressNumber} ${client.zipCode} ${client.cityName}`;
    }


    response.success();
});