import * as _ from "lodash";
import { BaseClass } from './subclass/BaseClass';

export abstract class QueryBuilder<T extends BaseClass> {

    protected query: Parse.Query<T>;


    protected constructor(object: new(...args: any[]) => T, includeArchived?) {
        this.query = new Parse.Query(object);

        if (!includeArchived) {
            this.doesNotExistOrFalse(BaseClass._archive);
        }
    }

    include(...includes: Array<keyof T>) {
        _.forEach(includes, (include: string) => {
            this.query.include(include)
        });

        return this;
    }

    matchingId(id: string) {
        this.query.equalTo(BaseClass._objectId, id);

        return this;
    }

    matchingOwner(user: Parse.User) {
        this.query.equalTo(BaseClass._owner, user);

        return this;
    }

    createdBefore(date: Date) {
        if (date) {
            this.query.lessThan(BaseClass._createdAt, date);
        }

        return this;
    }

    createdAfter(date: Date) {
        if (date) {
            this.query.greaterThan(BaseClass._createdAt, date);
        }

        return this;
    }

    createdAfterObject(object: Parse.Object) {
        if (object && object.createdAt) {
            this.query.greaterThan(BaseClass._createdAt, object.createdAt);
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

    doesNotExistOrFalse(attribute: keyof T) {

        const doesNotExist = this.query.doesNotExist(attribute);
        const isFalse = this.query.notEqualTo(attribute, false);

        // @ts-ignore
        this.query = Parse.Query.and(
            this.query,
            Parse.Query.or(doesNotExist, isFalse)
        );

        return this;
    }


    build(): Parse.Query<T> {
        return this.query;
    }
}