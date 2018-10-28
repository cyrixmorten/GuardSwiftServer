import {QueryBuilder} from "../QueryBuilder";
import {BaseClass} from "./BaseClass";
import {TaskType} from "./Task";

export interface IHeaderLogo {
    width: number;
    height: number;
    stretch: boolean;
    alignment: string;
    datauri: string;
}

export class ReportSettings extends BaseClass {

    static readonly className = 'ReportSettings';

    static readonly _taskTypes = 'taskTypes';

    static readonly _bccNames = 'bccNames';
    static readonly _bccEmails = 'bccEmails';
    
    static readonly _replyToName = 'replytoName';
    static readonly _replyToEmail = 'replytoEmail';

    static readonly _headerLogo = 'headerLogo';
    static readonly _altHeaderLogo = 'altHeaderLogo';
    static readonly _footer = 'footer';

    constructor() {
        super(ReportSettings.className);
    }

    get taskTypes(): TaskType[] {
        return this.get(ReportSettings._taskTypes);
    }

    set taskTypes(taskType: TaskType[]) {
        this.set(ReportSettings._taskTypes, taskType);
    }

    get bccNames(): string[] {
        return this.get(ReportSettings._bccNames) || [];
    }

    set bccNames(bccNames: string[]) {
        this.set(ReportSettings._bccNames, bccNames);
    }

    get bccEmails(): string[] {
        return this.get(ReportSettings._bccEmails) || [];
    }

    set bccEmails(bccEmails: string[]) {
        this.set(ReportSettings._bccEmails, bccEmails);
    }

    get replyToName(): string {
        return this.get(ReportSettings._replyToName) || '';
    }

    set replyToName(replyToName: string) {
        this.set(ReportSettings._replyToName, replyToName);
    }

    get replyToEmail(): string {
        return this.get(ReportSettings._replyToEmail) || '';
    }

    set replyToEmail(replyToEmail: string) {
        this.set(ReportSettings._replyToEmail, replyToEmail);
    }

    get headerLogo(): IHeaderLogo {
        return this.get(ReportSettings._headerLogo);
    }

    set headerLogo(headerLogo: IHeaderLogo) {
        this.set(ReportSettings._headerLogo, headerLogo);
    }

    get altHeaderLogo(): IHeaderLogo {
        return this.get(ReportSettings._altHeaderLogo);
    }

    set altHeaderLogo(altHeaderLogo: IHeaderLogo) {
        this.set(ReportSettings._altHeaderLogo, altHeaderLogo);
    }
    
    get footer(): string {
        return this.get(ReportSettings._footer);
    }

    set footer(footer: string) {
        this.set(ReportSettings._footer, footer);
    }
}

export class ReportSettingsQuery extends QueryBuilder<ReportSettings> {

    constructor() {
        super(ReportSettings);
    }

    matchingTaskType(taskType: TaskType): ReportSettingsQuery {
        this.query.equalTo(ReportSettings._taskTypes, taskType);

        return this;
    }

}