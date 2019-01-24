import BeforeSaveRequest = Parse.Cloud.BeforeSaveRequest;
import { BeforeSaveUtils } from './BeforeSaveUtils';
import { TaskGroupStarted } from '../../shared/subclass/TaskGroupStarted';

Parse.Cloud.beforeSave(TaskGroupStarted, (request: BeforeSaveRequest, response) => {
    BeforeSaveUtils.settUserAsOwner(request);

    response.success();
});




