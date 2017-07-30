"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var QueryBuilder = (function () {
    function QueryBuilder(object) {
        this.query = new Parse.Query(object);
    }
    QueryBuilder.prototype.build = function () {
        return this.query;
    };
    return QueryBuilder;
}());
exports.QueryBuilder = QueryBuilder;
//# sourceMappingURL=QueryBuilder.js.map