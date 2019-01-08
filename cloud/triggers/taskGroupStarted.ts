import BeforeSaveRequest = Parse.Cloud.BeforeSaveRequest;
import { BeforeSave } from './common/beforeSave';
import { TaskGroupStarted } from '../../shared/subclass/TaskGroupStarted';

Parse.Cloud.beforeSave(TaskGroupStarted, (request: BeforeSaveRequest) => {
    BeforeSave.settUserAsOwner(request);
});




