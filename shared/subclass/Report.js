"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseClass_1 = require("./BaseClass");
const QueryBuilder_1 = require("../QueryBuilder");
class Report extends BaseClass_1.BaseClass {
    constructor() {
        super(Report.className);
    }
    get name() {
        return this.get(Report._name);
    }
    set name(name) {
        this.set(Report._name, name);
    }
}
Report.className = 'Report';
Report._name = 'name';
exports.Report = Report;
class ReportQuery extends QueryBuilder_1.QueryBuilder {
    constructor() {
        super(Report);
    }
}
exports.ReportQuery = ReportQuery;
//# sourceMappingURL=Report.js.map