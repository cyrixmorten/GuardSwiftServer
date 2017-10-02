"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GeoCode = require("../utils/geocode");
const _ = require("lodash");
const Client_1 = require("../../shared/subclass/Client");
const Task_1 = require("../../shared/subclass/Task");
/*
 * Sanity check and obtain a GPS position for Client
 */
Parse.Cloud.beforeSave(Client_1.Client, (request, response) => {
    let client = request.object;
    let dirtyKeys = client.dirtyKeys();
    let lookupAddress = false;
    let addressKeys = [Client_1.Client._cityName, Client_1.Client._zipcode, Client_1.Client._addressName, Client_1.Client._addressNumber];
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
    }
    else {
        console.log("no address lookup");
        response.success();
    }
});
Parse.Cloud.afterSave(Client_1.Client, (request) => {
    let client = request.object;
    updateTasks(client);
});
let updateTasks = (client) => {
    new Task_1.TaskQuery()
        .matchingClient(client)
        .build()
        .find({ useMasterKey: true }).then((tasks) => {
        console.log('Updating tasks: ' + tasks.length);
        _.forEach(tasks, (task) => {
            task.client = client;
            task.save(null, { useMasterKey: true });
        });
    }, (error) => {
        console.error('error: ', error);
    });
};
let addAddressToClient = (Client) => {
    let addressName = Client.get("addressName");
    let addressNumber = Client.get("addressNumber");
    let zipcode = Client.get("zipcode");
    let cityName = Client.get("cityName");
    Client.set('fullAddress', addressName + " " + addressNumber);
    let searchAddress = addressName + " " + addressNumber + "," + zipcode + " "
        + cityName;
    if (addressName.length == 0) {
        return Parse.Promise.error("Address must not be empty");
    }
    else if (zipcode == 0) {
        if (cityName.length == 0) {
            return Parse.Promise.error("Zipcode and city name must not be empty");
        }
    }
    else {
        return GeoCode.lookupAddress(searchAddress);
    }
};
//# sourceMappingURL=client.js.map