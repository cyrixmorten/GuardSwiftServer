import {TaskGroup} from "./TaskGroup";
import {Task} from "./Task";
import {TaskGroupStarted} from "./TaskGroupStarted";

export class RegisterSubclasses {

    public static register() {
        Parse.Object.registerSubclass(Task.className, Task);
        Parse.Object.registerSubclass(TaskGroup.className, TaskGroup);
        Parse.Object.registerSubclass(TaskGroupStarted.className, TaskGroupStarted);
    }
}