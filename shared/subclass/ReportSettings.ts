import {QueryBuilder} from "../QueryBuilder";
import {BaseClass} from "./BaseClass";
import {TaskType} from "./Task";

export interface IHeaderLogo {
    alignment: string,
    datauri: string
}

export class ReportSettings extends BaseClass {

    static readonly className = 'ReportSettings';

    static readonly _taskType = 'taskType';

    static readonly _bccNames = 'bccNames';
    static readonly _bccEmails = 'bccEmails';
    
    static readonly _replyToName = 'replytoName';
    static readonly _replyToEmail = 'replytoEmail';

    static readonly _headerLogo = 'headerLogo';
    static readonly _footer = 'footer';

    constructor() {
        super(ReportSettings.className);
    }

    get taskType(): TaskType {
        return this.get(ReportSettings._taskType);
    }

    set taskType(taskType: TaskType) {
        this.set(ReportSettings._taskType, taskType);
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
        this.query.equalTo(ReportSettings._taskType, taskType);

        return this;
    }

}