import {BaseClass} from "./BaseClass";
import {QueryBuilder} from "../QueryBuilder";
import {ClientContact} from "./ClientContact";
import {Central, CentralQuery} from "./Central";
import * as _ from "lodash";
import HttpResponse = Parse.Cloud.HttpResponse;
import {Task} from "./Task";
import {API_GOOGLE_GEOCODE, googleGeocode} from "../../cloud/api/google/geocode.api";

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
        return this.get(Client._name) || '';
    }

    set name(name: string) {
        this.set(Client._name, name);
    }

    set clientId(clientId: string) {
        this.set(Client._clientId, clientId);
    }

    get clientId(): string {
        return this.get(Client._clientId) || '';
    }

    set placeId(placeId: string) {
        this.set(Client._placeId, placeId);
    }

    get placeId(): string {
        return this.get(Client._placeId) || '';
    }
    
    set street(street: string) {
        this.set(Client._street, street);
    }

    get street(): string {
        return this.get(Client._street) || '';
    }

    set streetNumber(streetNumber: string) {
        this.set(Client._streetNumber, streetNumber);
    }

    get streetNumber(): string {
        return this.get(Client._streetNumber) || '';
    }

    get streetNameAndNumber(): string {
        return `${this.street} ${this.streetNumber}`;
    }

    set city(city: string) {
        this.set(Client._city, city);
    }

    get city(): string {
        return this.get(Client._city);
    }

    set postalCode(postalCode: string) {
        this.set(Client._postalCode, postalCode);
    }

    get postalCode(): string {
        return this.get(Client._postalCode);
    }

    set fullAddress(fullAddress: string) {
        this.set(Client._fullAddress, fullAddress);
    }

    get fullAddress(): string {
        return this.get(Client._fullAddress);
    }

    set formattedAddress(formattedAddress: string) {
        this.set(Client._formattedAddress, formattedAddress);
    }

    get formattedAddress(): string {
        return this.get(Client._formattedAddress);
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

        if (!placeObject || !placeObject.address_components) {
            this.placeId = '';
            this.formattedAddress = searchAddress;
            this.street = '';
            this.streetNumber = '';
            this.fullAddress = searchAddress;
            this.city = '';
            this.postalCode = '';
            this.position = new Parse.GeoPoint({
                latitude: 1,
                longitude: 1
            });
        } else {

            let street = addressComponentByType(placeObject.address_components, 'route');
            let streetNumber = addressComponentByType(placeObject.address_components, 'street_number');

            this.placeId = placeObject.place_id;
            this.formattedAddress = placeObject.formatted_address;
            this.street = street;
            this.streetNumber = streetNumber;
            this.fullAddress = `${street} ${streetNumber}`;
            this.city = addressComponentByType(placeObject.address_components, 'locality');
            this.postalCode = addressComponentByType(placeObject.address_components, 'postal_code');
            this.position = placeObject.geometry ? new Parse.GeoPoint({
                latitude: placeObject.geometry.location.lat,
                longitude: placeObject.geometry.location.lng
            }) : new Parse.GeoPoint({
                latitude: 1,
                longitude: 1
            })
        }
    }


    public async fetchAndSetPlaceObject(searchAddress: string, isRetry: boolean = false): Promise<void> {
        console.log('fetchAndSetPlaceObject', isRetry, searchAddress);
        try {
            this.placeObject = await googleGeocode(searchAddress)[0];
        } catch (e) {
            if (isRetry) {

                console.error(e);

                console.error('Failed to create placeObject for ' + searchAddress);

                this.placeObject = {};
            }

            // A bit hacky modification of the search that seems to save most
            // poorly formatted addresses delivered by G4S alarms
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