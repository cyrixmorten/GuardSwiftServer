import * as _ from 'lodash';
import {Client} from "../../shared/subclass/Client";
import {Task, TaskQuery} from "../../shared/subclass/Task";

/*
 * Sanity check and obtain a GPS position for Client
 */
Parse.Cloud.beforeSave(Client,  async (request, response) => {
    
    let client = <Client>request.object;


    let addressChanges = false;
    let dirtyKeys = client.dirtyKeys();
    let addressKeys = [Client._cityName, Client._zipcode, Client._addressName, Client._addressNumber];
    for (let dirtyKey in dirtyKeys) {
        let dirtyValue = dirtyKeys[dirtyKey];
        if (_.includes(addressKeys, dirtyValue)) {
            addressChanges = true;
        }
    }

    if (addressChanges || !client.hasPlaceId()) {
        console.log("lookupAddress");

        let searchAddress = () => {
            let addressName = client.get(Client._addressName);
            let addressNumber = client.get(Client._addressNumber);
            let zipcode = client.get(Client._zipcode);
            let cityName = client.get(Client._cityName);

            client.set(Client._fullAddress, addressName + " " + addressNumber);

            return  `${addressName} ${addressNumber} ${zipcode} ${cityName}`;
        };

        await client.addPlaceObject(searchAddress());

    }


    response.success();

});

Parse.Cloud.afterSave(Client,  (request) => {

    let client = <Client>request.object;

    // update tasks with client address and position
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

});
