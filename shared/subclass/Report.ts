import {BaseClass} from "./BaseClass";
import {QueryBuilder} from "../QueryBuilder";

export class Report extends BaseClass {

    static readonly className = 'Report';

    static readonly _name = 'name';


    constructor() {
        super(Report.className);
    }

    get name(): string {
        return this.get(Report._name);
    }

    set name(name: string) {
        this.set(Report._name, name);
    }


}

export class ReportQuery extends QueryBuilder<Report> {

    constructor() {
        super(Report);
    }



}