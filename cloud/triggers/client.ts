import * as GeoCode from '../utils/geocode';
import * as _ from 'lodash';
import { Client } from "../../shared/subclass/Client";
import { Task, TaskQuery } from "../../shared/subclass/Task";
import AfterSaveRequest = Parse.Cloud.AfterSaveRequest;
import { BeforeSave } from './BeforeSave';
import * as parse from "parse";

/*
 * Sanity check and obtain a GPS position for Client
 */
Parse.Cloud.beforeSave(Client, async (request: parse.Cloud.BeforeSaveRequest) => {
    BeforeSave.setArchiveFalse(request);
    BeforeSave.settUserAsOwner(request);

    let client = request.object as Client;

    const shouldUpdatePosition = [Client._cityName, Client._zipcode, Client._addressName, Client._addressNumber]
        .some(clientKey => _.includes(client.dirtyKeys(), clientKey));

    if (!client.useCustomPosition && shouldUpdatePosition) {
        client.position = await addAddressToClient(client);
    }
});

Parse.Cloud.afterSave(Client, async (request: AfterSaveRequest) => {

    let client = <Client>request.object;

    const tasks = await new TaskQuery()
        .matchingClient(client)
        .build().find({useMasterKey: true});

    await Promise.all(_.map(tasks, (task: Task) => {
        task.client = client;
        return task.save(null, {useMasterKey: true});
    }));

});


let addAddressToClient = async (Client): Promise<Parse.GeoPoint> => {
    let addressName = Client.get("addressName");
    let addressNumber = Client.get("addressNumber");
    let zipcode = Client.get("zipcode");
    let cityName = Client.get("cityName");

    Client.set('fullAddress', addressName + " " + addressNumber);

    let searchAddress = addressName + " " + addressNumber + "," + zipcode + " "
        + cityName;

    if (addressName.length == 0) {
        throw "Address must not be empty";
    } else if (zipcode == 0) {
        if (cityName.length == 0) {
            throw "Zipcode and city name must not be empty";
        }
    } else {
        return GeoCode.lookupAddress(searchAddress);
    }
};