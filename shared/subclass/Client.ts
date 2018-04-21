import {BaseClass} from "./BaseClass";
import {QueryBuilder} from "../QueryBuilder";
import {ClientContact} from "./ClientContact";
import {Central, CentralQuery} from "./Central";
import * as _ from "lodash";
import HttpResponse = Parse.Cloud.HttpResponse;
import {Task} from "./Task";

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
        client.set(Client._owner, user);

        client.setUserACL(user);

        await client.fetchAndSetPlaceObject(alarmFullAddress);

        return client.save(null, {useMasterKey: true});
    };

    static readonly className = 'Client';

    static readonly _name = 'name';

    static readonly _clientId = 'clientId';
    static readonly _automatic = 'automatic';

    // TODO Replace 
    static readonly _cityName = 'cityName'; // city
    static readonly _zipcode = 'zipcode'; // postalCode
    static readonly _addressName = 'addressName'; // street
    static readonly _addressNumber = 'addressNumber'; // streetNumber
    // TODO Replace

    // TODO ensure added by placeObject (used by alarms)

    static readonly _placeObject = 'placeObject';
    static readonly _placeId = 'placeId';
    static readonly _fullAddress = 'fullAddress';
    static readonly _formattedAddress = 'formattedAddress';
    static readonly _street = 'street';
    static readonly _streetNumber = 'streetNumber';
    static readonly _city = '_city';
    static readonly _postalCode = '_postalCode';

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

    get placeObject(): any {
        return this.get(Client._placeObject) || {};
    }

    set placeObject(placeObject: any) {
        this.set(Client._placeObject, placeObject);
    }

    hasPlaceId(): boolean {
        return this.has(Client._placeId)
    }


    public applyPlaceObject(searchAddress: string = '') {

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

        let placeObject = this.placeObject;
        let street = addressComponentByType(placeObject.address_components, 'route');
        let streetNumber = addressComponentByType(placeObject.address_components, 'street_number');

        let placeProperties = {
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
        };

        if (!_.isEmpty(street)) {
            placeProperties = {
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
            }
        }

        _.forOwn(placeProperties, (value, key) => {
            this.set(key, value);
        });
    }


    public async fetchAndSetPlaceObject(searchAddress: string, isRetry: boolean = false): Promise<void> {


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
                this.placeObject = placeObject.results[0];
            }
        } catch (e) {
            if (isRetry) {

                console.error('Failed to create placeObject for ' + searchAddress);

                this.placeObject = {};
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

            return this.fetchAndSetPlaceObject(modifySearch(searchAddress), true)
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