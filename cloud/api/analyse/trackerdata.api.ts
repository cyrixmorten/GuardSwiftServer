import * as moment from "moment-timezone"
import FunctionRequest = Parse.Cloud.FunctionRequest;
import FunctionResponse = Parse.Cloud.FunctionResponse;
import {ClientQuery, Client} from "../../../shared/subclass/Client";
import {TrackerData, TrackerDataQuery} from "../../../shared/subclass/TrackerData";
import * as _ from "lodash";

export const API_FUNCTION_TRACKERDATA_CLIENT_RADIUS = "trackerDataClientRadius";

Parse.Cloud.define(API_FUNCTION_TRACKERDATA_CLIENT_RADIUS, async (request: FunctionRequest, response: FunctionResponse) => {

    // https://momentjs.com/timezone/
    let timeZone = 'Europe/Copenhagen';

    // Dates formatted as ISO 8601
    // Example date: 2013-02-18 09:30
    let fromDate = '2018-03-17 09:00';
    let toDate = '2018-03-18 12:00';

    // objectId of client
    let clientId = 'xfrZID1u2Y';

    // objectId of guard
    let guardId = 'b5TNgNG7ve';

    // radius meters wrt. client
    let searchRadiusMeters = 75;
    let triggerRadiusMeters = 50;

    try {
        let client: Client = await new ClientQuery().matchingId(clientId).build().first({useMasterKey: true});

        console.log('Kunde: ', client.name);
        console.log('Vægter: ', 'Mikael Hansen');
        console.log('Tid: ', fromDate, '-', toDate);
        console.log('Afstand søgt: ', '75 meter');

        let trackerData: TrackerData[] = await new TrackerDataQuery()
            .matchingGuard(guardId)
            .withinRadiusMeters(client.position, searchRadiusMeters)
            .createdAfter(moment(fromDate).tz(timeZone).toDate())
            .createdBefore(moment(toDate).tz(timeZone).toDate())
            .build().addAscending(TrackerData._clientTimeStamp).limit(999999)
            .find({useMasterKey: true});

        console.log('GPS positioner: ', trackerData.length);

        let withinCount: number = 0;

        _.forEach(trackerData, (data: TrackerData) => {

            let distKilometers = client.position.kilometersTo(data.position);
            let distMeters = distKilometers * 1000;

            let time = moment(data.clientTimeStamp).tz(timeZone).format('HH:mm:ss YYYY-MM-DD');

            console.log(time, 'Afstand meter: ', _.round(distMeters));

            if (distMeters <= triggerRadiusMeters) {
                withinCount++;

                if (withinCount === 1) {
                    console.log('--------');
                    console.log('Indenfor 50 meters radius');
                    console.log(moment(data.clientTimeStamp).tz(timeZone).format('HH:mm:ss YYYY-MM-DD'));
                    console.log('--------');
                }
            } else {
                withinCount = 0;
            }
        });

        response.success(trackerData.length);

    } catch (e) {
        response.error(JSON.stringify(e));
    }


});