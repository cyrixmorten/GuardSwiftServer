import { Report } from '../../shared/subclass/Report';
import { Client } from '../../shared/subclass/Client';
import { BeforeSave } from './BeforeSave';
import * as parse from "parse";
import { TaskGroup } from '../../shared/subclass/TaskGroup';
import { TaskGroupStarted } from '../../shared/subclass/TaskGroupStarted';
import { TaskQuery, Task, TaskType } from '../../shared/subclass/Task';
import * as _ from "lodash";

Parse.Cloud.beforeSave(Report, async (request: parse.Cloud.BeforeSaveRequest) => {
    BeforeSave.setArchiveFalse(request);
    BeforeSave.settUserAsOwner(request);

    const report = request.object as Report;

    setDefaults(report);
    await spreadClientData(report);
    await addTaskGroup(report);
    await addTaskGroups(report);
});

const setDefaults = (report: Report) => {
    report.isClosed = report.has(Report._isClosed) ? report.isClosed : false;
    report.isSent = report.has(Report._isSent) ? report.isSent : report.has(Report._mailStatus);
}

const spreadClientData = async (report: Report) => {
    if (report.client && !report.has(Report._clientName)) {
        const client: Client = await report.client.fetch({useMasterKey: true});
        report.clientName = client.name;
        report.clientAddress = client.addressName;
        report.clientAddressNumber = client.addressNumber;
        report.clientFullAddress = `${client.addressName} ${client.addressNumber} ${client.zipCode} ${client.cityName}`;
    }
}

const addTaskGroup = async (report: Report) => {
    if (report.taskGroupStarted && !report.has(Report._taskGroup)) {
        const taskGroupStarted: TaskGroupStarted = await report.taskGroupStarted.fetch({useMasterKey: true});
        report.taskGroup = TaskGroup.createWithoutData(taskGroupStarted.taskGroup.id);
    }
}

const addTaskGroups = async (report: Report) => {
    if (!report.has(Report._taskGroups)) {
        const client: Client = await report.client.fetch({useMasterKey: true});

        const taskTypes = report.isMatchingTaskType(TaskType.REGULAR, TaskType.RAID) ? [TaskType.REGULAR, TaskType.RAID] : [];

        const taskQueries = taskTypes.map(taskType => {
            return new TaskQuery()
                .matchingClient(client)
                .matchingTaskType(taskType)
                .build();
        });

        const allTasksMatchingClient = await Promise.all(taskQueries.map(taskQuery => taskQuery.find({useMasterKey: true})));
        
        _.flatten(allTasksMatchingClient).forEach(task => {
            report.addTaskGroup(TaskGroup.createWithoutData(task.taskGroup.id));
            report.addTaskGroupStarted(TaskGroupStarted.createWithoutData(task.taskGroupStarted.id));
        })
    }
}