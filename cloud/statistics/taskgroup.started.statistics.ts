import { TaskGroupStarted, TaskGroupStartedQuery } from "../../shared/subclass/TaskGroupStarted";
import { Task, TaskQuery } from "../../shared/subclass/Task";
import { EventLog, EventLogQuery } from '../../shared/subclass/EventLog';
import * as _ from "lodash"; 
import { TaskGroup } from '../../shared/subclass/TaskGroup';

export interface ITaskEventlogs {
    task: Task,
    eventLogs: EventLog[]
}


export class TaskgroupStartedStats  {

    taskGroup: TaskGroup;
    taskEventLogs: ITaskEventlogs[];

    constructor(public taskGroupStarted: string | TaskGroupStarted) {}

    async fetch(): Promise<TaskgroupStartedStats> {
        if (_.isString(this.taskGroupStarted)) {        
            this.taskGroupStarted = TaskGroupStarted.createWithoutData<TaskGroupStarted>(this.taskGroupStarted);
            await this.taskGroupStarted.fetch({useMasterKey: true});
        }

        this.taskGroup = TaskGroup.createWithoutData(this.taskGroupStarted.taskGroup.id);
        await this.taskGroup.fetch({useMasterKey: true});

        const tasks: Task[] = await new TaskQuery().matchingTaskGroup(this.taskGroup).build().find({useMasterKey: true});

        this.taskEventLogs = await Promise.all(_.map(tasks, async (task) => {
            return {
                task,
                eventLogs: await new EventLogQuery().matchingTask(task).build().find({useMasterKey: true})
            }
        }));

        return this;
    }

}