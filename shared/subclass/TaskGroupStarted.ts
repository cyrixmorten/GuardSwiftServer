import {BaseClass} from "./BaseClass";
import * as _ from "lodash";
import {TaskGroup} from "./TaskGroup";
import {QueryBuilder} from "../QueryBuilder";

export class TaskGroupStarted extends BaseClass {

    static readonly className = 'TaskGroupStarted';

    static readonly _name = 'name';
    static readonly _taskGroup = 'taskGroup';
    static readonly _timeStarted = 'timeStarted';
    static readonly _timeEnded = 'timeEnded';

    constructor(attr?: {
        taskGroup: TaskGroup,
    }) {
        super(TaskGroupStarted.className);

        if (attr) {
            if (attr.taskGroup) {
                this.owner = attr.taskGroup.owner;
                this.name = attr.taskGroup.name;
                this.taskGroup = (<any>attr.taskGroup).toPointer();
                this.timeStarted = new Date();
                this.setACL(attr.taskGroup.getACL());
            }
        }
    }

    get name(): string {
        return this.get(TaskGroupStarted._name);
    }

    set name(name: string) {
        this.set(TaskGroupStarted._name, name);
    }

    get taskGroup(): TaskGroup {
        return this.get(TaskGroupStarted._taskGroup);
    }

    set taskGroup(taskGroup: TaskGroup) {
        this.set(TaskGroupStarted._taskGroup, taskGroup);
    }

    get timeStarted(): Date {
        return this.get(TaskGroupStarted._timeStarted);
    }

    set timeStarted(date: Date) {
        this.set(TaskGroupStarted._timeStarted, date);
    }

    get timeEnded(): Date {
        return this.get(TaskGroupStarted._timeEnded);
    }


    set timeEnded(date: Date) {
        if (_.isUndefined(date)) {
            this.unset(TaskGroupStarted._timeEnded);
            return;
        }

        this.set(TaskGroupStarted._timeEnded, date);
    }


}

export class TaskGroupStartedQuery extends QueryBuilder<TaskGroupStarted>{

    constructor() {
        super(TaskGroupStarted);
    }

    matchingTaskGroup(taskGroup: TaskGroup): TaskGroupStartedQuery {
        this.query.equalTo(TaskGroupStarted._taskGroup, taskGroup);
        return this;
    }

    notEnded(): TaskGroupStartedQuery {
        this.query.doesNotExist(TaskGroupStarted._timeEnded);
        return this;
    }

}