"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class QueryBuilder {
    constructor(object) {
        this.query = new Parse.Query(object);
    }
    matchingId(id) {
        this.query.equalTo('objectId', id);
        return this;
    }
    matchingOwner(user) {
        this.query.equalTo('owner', user);
        return this;
    }
    build() {
        return this.query;
    }
}
exports.QueryBuilder = QueryBuilder;
//# sourceMappingURL=QueryBuilder.js.map