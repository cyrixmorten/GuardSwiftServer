import {TaskGroup} from "./TaskGroup";
import {Task} from "./Task";
import {TaskGroupStarted} from "./TaskGroupStarted";
import {Guard} from "./Guard";
import {User} from "./User";
import {Client} from "./Client";

export class RegisterSubclasses {

    public static register() {
        Parse.Object.registerSubclass(User.className, User);
        Parse.Object.registerSubclass(Guard.className, Guard);
        Parse.Object.registerSubclass(Client.className, Client);
        Parse.Object.registerSubclass(Task.className, Task);
        Parse.Object.registerSubclass(TaskGroup.className, TaskGroup);
        Parse.Object.registerSubclass(TaskGroupStarted.className, TaskGroupStarted);
    }
}