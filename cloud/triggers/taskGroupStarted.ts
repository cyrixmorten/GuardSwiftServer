import BeforeSaveRequest = Parse.Cloud.BeforeSaveRequest;
import { TaskGroupStarted } from '../../shared/subclass/TaskGroupStarted';
import { BeforeSave } from './BeforeSave';

Parse.Cloud.beforeSave(TaskGroupStarted, (request: BeforeSaveRequest) => {
    BeforeSave.setArchiveFalse(request);
    BeforeSave.settUserAsOwner(request);
});




