import * as _ from "lodash";
import { BaseClass } from './subclass/BaseClass';

export abstract class QueryBuilder<T extends BaseClass> {

    protected query: Parse.Query<T>;


    protected constructor(object: new(...args: any[]) => T, includeArchived?) {
        this.query = new Parse.Query(object);

        if (!includeArchived) {
            this.notArchived();
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

    private notArchived() {
        const doesNotExist = this.query.doesNotExist(BaseClass._archive);
        const isFalse = this.query.notEqualTo(BaseClass._archive, false);

        this.query = Parse.Query.or(this.query, doesNotExist, isFalse);

        return this;
    }


    build(): Parse.Query<T> {
        return this.query;
    }
}