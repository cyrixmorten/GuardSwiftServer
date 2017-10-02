import * as GeoCode from '../utils/geocode';
import * as _ from 'lodash';
import {Client} from "../../shared/subclass/Client";
import {Task, TaskQuery} from "../../shared/subclass/Task";
import IPromise = Parse.IPromise;

/*
 * Sanity check and obtain a GPS position for Client
 */
Parse.Cloud.beforeSave(Client,  (request, response) => {
    
    let client = <Client>request.object;

    let dirtyKeys = client.dirtyKeys();
    let lookupAddress = false;
    let addressKeys = [Client._cityName, Client._zipcode, Client._addressName, Client._addressNumber];
    for (let dirtyKey in dirtyKeys) {
        let dirtyValue = dirtyKeys[dirtyKey];
        if (_.includes(addressKeys, dirtyValue)) {
            lookupAddress = true;
        }
    }

    if (lookupAddress) {
        console.log("lookupAddress");
        addAddressToClient(client).then((point) => {
            console.log('setting new position:', point);
            client.position = point;

            response.success();
        }, (error) => {
            response.error(error);
        });
    } else {
        console.log("no address lookup");
        response.success();
    }

});

Parse.Cloud.afterSave(Client,  (request) => {

    let client = <Client>request.object;

    updateTasks(client);

});

let updateTasks = (client: Client) => {
    new TaskQuery()
        .matchingClient(client)
        .build()
        .find({useMasterKey: true}).then((tasks: Task[]) => {
        console.log('Updating tasks: ' + tasks.length);

        _.forEach(tasks, (task: Task) => {
            task.client = client;
            task.save(null, {useMasterKey: true});
        });

    }, (error) => {
        console.error('error: ', error);
    })
};

let addAddressToClient = (Client): IPromise<any> => {

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