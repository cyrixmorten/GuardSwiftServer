import * as GeoCode from '../utils/geocode';
import * as _ from 'lodash';
import {Client} from "../../shared/subclass/Client";
import {Task, TaskQuery} from "../../shared/subclass/Task";

/*
 * Sanity check and obtain a GPS position for Client
 */
Parse.Cloud.beforeSave(Client,  async (request, response) => {
    
    let client = <Client>request.object;

    const shouldUpdatePosition = [Client._cityName, Client._zipcode, Client._addressName, Client._addressNumber]
        .some(clientKey => _.includes(client.dirtyKeys(), clientKey));

    if (shouldUpdatePosition) {
        try {
            client.position = await addAddressToClient(client);
        } catch (e) {
            response.error(e);
            return;
        }
    }

    response.success();
});

Parse.Cloud.afterSave(Client,  async (request) => {

    let client = <Client>request.object;

    const tasks = await new TaskQuery()
        .matchingClient(client)
        .build().find({useMasterKey: true});

    return Promise.all(_.map(tasks, (task: Task) => {
        task.client = client;
        return task.save(null, {useMasterKey: true});
    }));

});


let addAddressToClient = async (Client): Promise<Parse.GeoPoint> => {
    console.log("addAddressToClient");

    let addressName = Client.get("addressName");
    let addressNumber = Client.get("addressNumber");
    let zipcode = Client.get("zipcode");
    let cityName = Client.get("cityName");

    Client.set('fullAddress', addressName + " " + addressNumber);

    let searchAddress = addressName + " " + addressNumber + "," + zipcode + " "
        + cityName;

    if (addressName.length == 0) {
        return Parse.Promise.error("Address must not be empty");
    } else if (zipcode == 0) {
        if (cityName.length == 0) {
            return Parse.Promise.error("Zipcode and city name must not be empty");
        }
    } else {
        return GeoCode.lookupAddress(searchAddress);
    }
};