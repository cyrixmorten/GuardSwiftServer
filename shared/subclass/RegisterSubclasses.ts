import {TaskGroup} from "./TaskGroup";
import {Task} from "./Task";
import {TaskGroupStarted} from "./TaskGroupStarted";
import {Guard} from "./Guard";
import {User} from "./User";
import {Client} from "./Client";
import {EventLog} from "./EventLog";
import {Central} from "./Central";
import {Person} from "./Person";
import {Report} from "./Report";
import {ReportSettings} from "./ReportSettings";
import {ClientContact} from "./ClientContact";

export class RegisterSubclasses {

    public static register() {
        Parse.Object.registerSubclass(User.className, User);
        Parse.Object.registerSubclass(Guard.className, Guard);
        Parse.Object.registerSubclass(Client.className, Client);
        Parse.Object.registerSubclass(Task.className, Task);
        Parse.Object.registerSubclass(TaskGroup.className, TaskGroup);
        Parse.Object.registerSubclass(TaskGroupStarted.className, TaskGroupStarted);
        Parse.Object.registerSubclass(EventLog.className, EventLog);
        Parse.Object.registerSubclass(Central.className, Central);
        Parse.Object.registerSubclass(Person.className, Person);
        Parse.Object.registerSubclass(Report.className, Report);
        Parse.Object.registerSubclass(ReportSettings.className, ReportSettings);
        Parse.Object.registerSubclass(ClientContact.className, ClientContact);
    }
}