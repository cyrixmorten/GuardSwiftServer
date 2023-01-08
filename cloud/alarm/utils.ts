import * as _ from 'lodash';
import {lookupPlaceObject} from "../utils/geocode";
import {Task} from '../../shared/subclass/Task';
import {Central} from "../../shared/subclass/Central";
import {User} from "../../shared/subclass/User";

export class AlarmUtils {

    static async findAlarm(options) {
        console.log('options: ', options);

        let Alarm = Parse.Object.extend('Task');
        let query = new Parse.Query(Alarm);
        query.equalTo('central', options.central);
        query.equalTo('owner', options.user);
        query.equalTo('fullAddress', options.parsed.alarmObject.fullAddress);

        return query.first({useMasterKey: true});
    };

    static async findCentralByPhoneNumber(sender: string): Promise<Central | undefined> {
        let query = new Parse.Query<Central>(Parse.Object.extend('Central'));
        query.equalTo('sendFrom', sender);

        return query.first({useMasterKey: true});
    };

    static async findCentralByAPIKey(key: string): Promise<Central | undefined> {
        let query = new Parse.Query<Central>(Parse.Object.extend('Central'));
        query.equalTo('apiKey', key);

        return query.first({useMasterKey: true});
    };


    static async findUserByPhoneNumber(receiver: string): Promise<User | undefined> {
        let query = new Parse.Query(Parse.User);
        query.equalTo('sendTo', receiver);

        return await query.first({useMasterKey: true}) as User
    };

    static async findUserByName(name: string): Promise<User | undefined> {
        let query = new Parse.Query(Parse.User);
        query.equalTo('username', name);

        return await query.first({useMasterKey: true}) as User
    };

    static async findClient(user, queryMap) {
        console.log('findClient', user, queryMap);

        let Client = Parse.Object.extend("Client");
        let query = new Parse.Query(Client);
        query.equalTo('owner', user);

        _.forOwn(queryMap, function (value, key) {
            if (!_.isUndefined(value)) {
                query.equalTo(key, value);
            }
        });


        return query.first({useMasterKey: true});
    };

    static async createClient(user, alarm: Task) {
        console.log('createClient');

        let id = alarm.clientId;
        let name = alarm.clientName;
        let fullAddress = alarm.fullAddress;

        let placeObject = {};

        try {
            placeObject = await lookupPlaceObject(fullAddress);
        } catch (e) {
            console.log('Failed to look up address for: ' + fullAddress);

            placeObject = {
                placeObject: {},
                placeId: '',
                formattedAddress: fullAddress,
                street: '',
                streetNumber: '',
                city: '',
                postalCode: '',
                position: new Parse.GeoPoint({
                    latitude: 1,
                    longitude: 1
                })
            };
        }


        let Client = Parse.Object.extend("Client");
        let client = new Client();

        client.set('clientId', id);
        client.set('automatic', true);
        client.set('name', name);
        client.set('fullAddress', fullAddress);
        client.set('owner', user);

        let acl = new Parse.ACL();
        acl.setReadAccess(user.id, true);
        acl.setWriteAccess(user.id, true);
        acl.setPublicReadAccess(false);
        acl.setPublicWriteAccess(false);

        client.setACL(acl);

        _.forOwn(placeObject, function (value, key) {
            client.set(key, value);
        });

        return client.save(null, {useMasterKey: true});
    };
}
