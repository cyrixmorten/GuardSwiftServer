export abstract class QueryBuilder<T extends Parse.Object> {

    protected query: Parse.Query<T>;

    constructor(object: new(...args: any[]) => T) {
        this.query = new Parse.Query(object);
    }

    build(): Parse.Query<T> {
        return this.query;
    }
}