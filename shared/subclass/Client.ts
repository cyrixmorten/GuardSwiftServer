import {BaseClass} from "./BaseClass";
import {QueryBuilder} from "../QueryBuilder";
import {ClientContact} from "./ClientContact";
import {Central, CentralQuery} from "./Central";
import * as _ from "lodash";
import HttpResponse = Parse.Cloud.HttpResponse;
import {Task} from "./Task";

type GSPlaceObject = {
    placeObject: Object,
    placeId: string,
    formattedAddress: string,
    street: string,
    streetNumber: string,
    fullAddress: string,
    city: string,
    postalCode: string,
    position: Parse.GeoPoint;
}

export class Client extends BaseClass {

    static async createFromAlarm(user: Parse.User, alarm: Task) {
        console.log('createClient');

        let clientId = alarm.clientId;
        let name = alarm.clientName;
        let alarmFullAddress = alarm.fullAddress;

        let client = new Client();

        client.set(Client._clientId, clientId);
        client.set(Client._automatic, true);
        client.set(Client._name, name);
        client.set(Client._fullAddress, alarmFullAddress);
        client.set(Client._owner, user);

        client.setUserACL(user);

        await client.addPlaceObject(alarmFullAddress);


        return client.save(null, {useMasterKey: true});
    };

    static readonly className = 'Client';

    static readonly _name = 'name';

    static readonly _clientId = 'clientId';
    static readonly _automatic = 'automatic';

    // TODO Replace 
    static readonly _cityName = 'cityName';
    static readonly _zipcode = 'zipcode';
    static readonly _addressName = 'addressName';
    static readonly _addressNumber = 'addressNumber';
    // TODO Replace

    // TODO ensure added by placeObject (used by alarms)
    static readonly _fullAddress = 'fullAddress';


    static readonly _placeId = 'placeId';
    static readonly _placeObject = 'placeObject';

    static readonly _position = 'position';

    static readonly _contacts = 'contacts';


    constructor() {
        super(Client.className);
    }

    get name(): string {
        return this.get(Client._name);
    }

    set name(name: string) {
        this.set(Client._name, name);
    }

    set clientId(clientId: string) {
        this.set(Client._clientId, clientId);
    }

    get clientId(): string {
        return this.get(Client._clientId);
    }


    set fullAddress(fullAddress: string) {
        this.set(Client._fullAddress, fullAddress);
    }

    get fullAddress(): string {
        return this.get(Client._fullAddress);
    }

    get position(): Parse.GeoPoint {
        return this.get(Client._position);
    }

    set position(position: Parse.GeoPoint) {
        this.set(Client._position, position);
    }

    get contacts(): ClientContact[] {
        return this.get(Client._contacts);
    }

    set contacts(contacts: ClientContact[]) {
        this.set(Client._contacts, contacts);
    }

    get placeObject(): Object {
        return this.get(Client._placeObject);
    }

    set placeObject(placeObject: Object) {
        this.set(Client._placeObject, placeObject);
    }

    hasPlaceId(): boolean {
        return this.has(Client._placeId)
    }


    async addPlaceObject(searchAddress: string) {

        let gsPlaceObject: GSPlaceObject = await this.lookupPlaceObject(searchAddress);

        _.forOwn(gsPlaceObject,  (value, key) => {
            this.set(key, value);
        });

    }

    private async lookupPlaceObject(searchAddress: string, isRetry: boolean = false): Promise<GSPlaceObject> {

        let toGSPlaceObject = (placeObject): GSPlaceObject => {

            let addressComponentByType = (components: any[], type) => {
                if (_.isEmpty(components)) {
                    return '';
                }

                let component = _.find(components, (component) => {
                    return _.includes(component.types, type);
                });

                if (component) {
                    return component.long_name;
                }

                return '';
            };

            let street = addressComponentByType(placeObject.address_components, 'route');
            let streetNumber = addressComponentByType(placeObject.address_components, 'street_number');

            return {
                placeObject: placeObject,
                placeId: placeObject.place_id,
                formattedAddress: placeObject.formatted_address,
                street: street,
                streetNumber: streetNumber,
                fullAddress: street + ' ' + streetNumber,
                city: addressComponentByType(placeObject.address_components, 'locality'),
                postalCode: addressComponentByType(placeObject.address_components, 'postal_code'),
                position: placeObject.geometry ? new Parse.GeoPoint({
                    latitude: placeObject.geometry.location.lat,
                    longitude: placeObject.geometry.location.lng
                }) : new Parse.GeoPoint({
                    latitude: 1,
                    longitude: 1
                })
            };
        };

        try {
            let httpResponse: HttpResponse = await Parse.Cloud.httpRequest({
                url: 'https://maps.googleapis.com/maps/api/geocode/json',
                params: {
                    address: searchAddress,
                    key: process.env.GOOGLE_GEOCODE_API_KEY
                }
            });

            let placeObject = httpResponse.data;

            if (placeObject.status === "OK") {
                return toGSPlaceObject(placeObject.results[0]);
            }
        } catch (e) {
            if (isRetry) {

                console.error('Failed to create placeObject for ' + searchAddress);

                return {
                    placeObject: {},
                    placeId: '',
                    formattedAddress: searchAddress,
                    street: '',
                    streetNumber: '',
                    fullAddress: searchAddress,
                    city: '',
                    postalCode: '',
                    position: new Parse.GeoPoint({
                        latitude: 1,
                        longitude: 1
                    })
                }
            }

            let modifySearch = (searchAddress): string => {
                let searchWords: string[] = _.words(searchAddress);

                let zipcodes: string[] = _.filter(searchWords, (word) => {
                    return word.length === 4;
                });

                let others = _.without(searchWords, ...zipcodes);

                let newAddress = '';
                if (!_.isEmpty(others)) {
                    if (others.length >= 1) {
                        newAddress += others[0];
                        newAddress += " ";
                    }
                    if (others.length >= 2) {
                        newAddress += others[1];
                        newAddress += " ";
                    }
                }

                let zipcode = _.last(zipcodes);
                if (zipcode) {
                    newAddress += zipcode;
                }

                return newAddress;
            };

            return exports.lookupPlaceObject(modifySearch(searchAddress), true)
        }

    };
}

export class ClientQuery extends QueryBuilder<Client> {

    constructor() {
        super(Client);
    }

    matchingClientId(clientId: string): ClientQuery {
        this.query.equalTo(Client._clientId, clientId);

        return this;
    }

    matchingFullAddress(fullAddress: string): ClientQuery {
        this.query.equalTo(Client._fullAddress, fullAddress);

        return this;
    }

}