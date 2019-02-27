import BeforeSaveRequest = Parse.Cloud.BeforeSaveRequest;
import { TaskGroupStarted } from '../../shared/subclass/TaskGroupStarted';
import { BeforeSave } from './BeforeSave';

Parse.Cloud.beforeSave(TaskGroupStarted, (request: BeforeSaveRequest, response) => {
    BeforeSave.setArchiveFalse(request);
    BeforeSave.settUserAsOwner(request);

    response.success();
});




