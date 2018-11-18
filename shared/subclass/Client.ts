import {BaseClass} from "./BaseClass";
import {QueryBuilder} from "../QueryBuilder";
import {ClientContact} from "./ClientContact";
import {TaskType} from './Task';

export type TaskRadiusMap = Map<TaskType, number>;

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

    static readonly _useAltHeaderLogo = 'useAltHeaderLogo';

    static readonly _taskRadius = 'taskRadius';

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

    get useAltHeaderLogo(): boolean {
        return this.get(Client._useAltHeaderLogo);
    }

    set useAltHeaderLogo(useAltHeaderLogo: boolean) {
        this.set(Client._useAltHeaderLogo, useAltHeaderLogo);
    }

    get taskRadius(): TaskRadiusMap {
        return this.get(Client._taskRadius);
    }

    set taskRadius(taskRadius: TaskRadiusMap) {
        this.set(Client._taskRadius, taskRadius);
    }
}

export class ClientQuery extends QueryBuilder<Client> {

    constructor() {
        super(Client);
    }



}