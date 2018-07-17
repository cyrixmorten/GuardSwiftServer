import {Report} from "../../../../shared/subclass/Report";
import {TaskGroup} from "../../../../shared/subclass/TaskGroup";

export type TaskGroupData = {
    taskGroup: TaskGroup;
    reports: Report[];
};

export interface ITaskGroupDataProvider {
    getData(taskGroup: TaskGroup): Promise<TaskGroupData>;
}

export class TaskGroupDataProvider implements ITaskGroupDataProvider {

    async getData(taskGroup: TaskGroup): Promise<TaskGroupData> {
        return {
            taskGroup: taskGroup,
            reports: [],
        }
    }


}