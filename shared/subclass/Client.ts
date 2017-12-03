import {BaseClass} from "./BaseClass";
import {QueryBuilder} from "../QueryBuilder";
import {Person} from "./Person";

export class Client extends BaseClass {

    static readonly className = 'Client';

    static readonly _name = 'name';

    static readonly _clientId = 'clientId';

    static readonly _cityName = 'cityName';
    static readonly _zipcode = 'zipcode';
    static readonly _addressName = 'addressName';
    static readonly _addressNumber = 'addressNumber';
    static readonly _fullAddress = 'fullAddress';

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

    get contacts(): Person[] {
        return this.get(Client._contacts);
    }

    set contacts(contacts: Person[]) {
        this.set(Client._contacts, contacts);
    }

}

export class ClientQuery extends QueryBuilder<Client> {

    constructor() {
        super(Client);
    }



}