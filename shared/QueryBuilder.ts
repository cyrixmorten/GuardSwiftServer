import * as _ from "lodash";
import {Report} from './subclass/Report';

export abstract class QueryBuilder<T extends Parse.Object> {

    protected query: Parse.Query<T>;

    static readonly _objectId = 'objectId';
    static readonly _owner = 'owner';
    static readonly _archive = 'archive';

    static readonly _createdAt = 'createdAt';

    protected constructor(object: new(...args: any[]) => T) {
        this.query = new Parse.Query(object);
    }

    include(...includes: Array<keyof T>) {
        _.forEach(includes, (include: string) => {
            this.query.include(include)
        });

        return this;
    }

    matchingId(id: string) {
        this.query.equalTo(QueryBuilder._objectId, id);

        return this;
    }

    hasClient() {
        this.query.exists(Report._client);

        return this;
    }

    matchingOwner(user: Parse.User) {
        this.query.equalTo(QueryBuilder._owner, user);

        return this;
    }

    createdBefore(date: Date) {
        if (date) {
            this.query.lessThan(QueryBuilder._createdAt, date);
        }

        return this;
    }

    createdAfter(date: Date) {
        if (date) {
            this.query.greaterThan(QueryBuilder._createdAt, date);
        }

        return this;
    }

    createdAfterObject(object: Parse.Object) {
        if (object && object.createdAt) {
            console.log('created after', object.createdAt);

            this.query.greaterThan(QueryBuilder._createdAt, object.createdAt);
        } else {
            console.error('createdAfterObject called with non parse object', object);
        }

        return this;
    }

    doesNotExist(key: keyof T) {
        this.query.doesNotExist(_.toString(key));

        return this;
    }

    greaterThan(key: keyof T, date: Date) {
        this.query.greaterThan(key, date);

        return this;
    }

    lessThan(key: keyof T, date: Date) {
        this.query.lessThan(key, date);

        return this;
    }

    notArchived() {
        const doesNotExist = this.query.doesNotExist(QueryBuilder._archive);
        const isFalse = this.query.notEqualTo(QueryBuilder._archive, false);

        this.query = Parse.Query.or(this.query, doesNotExist, isFalse);

        return this;
    }

    build(): Parse.Query<T> {
        return this.query;
    }
}