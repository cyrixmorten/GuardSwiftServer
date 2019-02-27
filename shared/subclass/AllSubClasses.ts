import { TaskGroup } from "./TaskGroup";
import { Task } from "./Task";
import { TaskGroupStarted } from "./TaskGroupStarted";
import { Guard } from "./Guard";
import { User } from "./User";
import { Client } from "./Client";
import { EventLog } from "./EventLog";
import { Central } from "./Central";
import { Person } from "./Person";
import { Report } from "./Report";
import { ReportSettings } from "./ReportSettings";
import { ClientContact } from "./ClientContact";
import { Tracker } from "./Tracker";
import { TrackerData } from "./TrackerData";
import { Dictionary } from 'lodash';
import * as _ from 'lodash';

export class AllSubClasses {

    private static nameToObject: Dictionary<any> = {
        [User.className]: User,
        [Guard.className]: Guard,
        [Client.className]: Client,
        [Task.className]: Task,
        [TaskGroup.className]: TaskGroup,
        [TaskGroupStarted.className]: TaskGroupStarted,
        [EventLog.className]: EventLog,
        [Central.className]: Central,
        [Person.className]: Person,
        [Report.className]: Report,
        [ReportSettings.className]: ReportSettings,
        [ClientContact.className]: ClientContact,
        [Tracker.className]: Tracker,
        [TrackerData.className]: TrackerData,
    };

    public static classNames(): string[] {
        return _.keys(this.nameToObject);
    }

    public static register() {
        AllSubClasses.classNames().forEach((name) => {
            Parse.Object.registerSubclass(name, this.nameToObject[name]);
        });
    }
}