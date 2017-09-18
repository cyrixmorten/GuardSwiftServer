import * as GeoCode from '../utils/geocode';
import * as _ from 'lodash';
import {Client} from "../../shared/subclass/Client";
import {Task, TaskQuery} from "../../shared/subclass/Task";

/*
 * Sanity check and obtain a GPS position for Client
 */
Parse.Cloud.beforeSave(Client,  (request, response) => {
    
    let Client = request.object;

    let dirtyKeys = Client.dirtyKeys();
    let lookupAddress = false;
    let addressKeys = ["cityName", "zipcode", "addressName", "addressNumber"];
    for (let dirtyKey in dirtyKeys) {
        let dirtyValue = dirtyKeys[dirtyKey];
        if (_.includes(addressKeys, dirtyValue)) {
            lookupAddress = true;
        }
    }

    if (lookupAddress) {
        console.log("do addAddressToClient");
        addAddressToClient(Client, response);
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

            task.clientId = client.get('clientId');
            task.clientName = client.get('clientName');
            task.position = client.get('position');

            task.save(null, {useMasterKey: true});
        });

    }, function(error) {
        console.error('error: ', error);
    })
};

let addAddressToClient = function (Client, response) {

    let addressName = Client.get("addressName");
    let addressNumber = Client.get("addressNumber");
    let zipcode = Client.get("zipcode");
    let cityName = Client.get("cityName");

    Client.set('fullAddress', addressName + " " + addressNumber);

    let searchAddress = addressName + " " + addressNumber + "," + zipcode + " "
        + cityName;

    if (addressName.length == 0) {
        response.error("Address must not be empty");
    } else if (zipcode == 0) {
        if (cityName.length == 0) {
            response.error("Zipcode and city name must not be empty");
        }
    } else {
        GeoCode.lookupAddress(searchAddress).then(function (point) {

            Client.set("position", point);

            console.log('setting new position:');
            console.log(point);

            Client.set('positionUpdated', new Date());
            response.success();
        }, function (error) {
            response.error("Address not found: " + searchAddress);
        });
    }
};