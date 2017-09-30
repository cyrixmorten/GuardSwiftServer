import {BaseClass} from "./BaseClass";
import {QueryBuilder} from "../QueryBuilder";

export class Client extends BaseClass {

    static readonly className = 'Client';

    static readonly _name = 'name';

    static readonly _cityName = 'cityName';
    static readonly _zipcode = 'zipcode';
    static readonly _addressName = 'addressName';
    static readonly _addressNumber = 'addressNumber';

    static readonly _position = 'position';


    constructor() {
        super(Client.className);
    }

    get name(): string {
        return this.get(Client._name);
    }

    set name(name: string) {
        this.set(Client._name, name);
    }

    get position(): Parse.GeoPoint {
        return this.get(Client._position);
    }

    set position(position: Parse.GeoPoint) {
        this.set(Client._position, position);
    }

}

export class ClientQuery extends QueryBuilder<Client> {

    constructor() {
        super(Client);
    }



}