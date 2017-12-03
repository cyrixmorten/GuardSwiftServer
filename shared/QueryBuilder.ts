export abstract class QueryBuilder<T extends Parse.Object> {

    protected query: Parse.Query<T>;

    static readonly _objectId = 'objectId';
    static readonly _owner = 'owner';

    static readonly _createdAt = 'createdAt';

    constructor(object: new(...args: any[]) => T) {
        this.query = new Parse.Query(object);
    }

    matchingId(id: string) {
        this.query.equalTo(QueryBuilder._objectId, id);

        return this;
    }

    matchingOwner(user: Parse.User) {
        this.query.equalTo(QueryBuilder._owner, user);

        return this;
    }

    createdBefore(date: Date) {
        this.query.lessThan(QueryBuilder._createdAt, date);

        return this;
    }

    createdAfter(date: Date) {
        this.query.greaterThan(QueryBuilder._createdAt, date);

        return this;
    }

    build(): Parse.Query<T> {
        return this.query;
    }
}