export abstract class QueryBuilder<T extends Parse.Object> {

    protected query: Parse.Query<T>;

    constructor(object: new(...args: any[]) => T) {
        this.query = new Parse.Query(object);
    }

    matchingId(id: string) {
        this.query.equalTo('objectId', id);

        return this;
    }

    matchingOwner(user: Parse.User) {
        this.query.equalTo('owner', user);

        return this;
    }

    build(): Parse.Query<T> {
        return this.query;
    }
}