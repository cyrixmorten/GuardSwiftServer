import { BeforeSave } from './BeforeSave';
import { EventType } from '../../shared/subclass/EventType';
import * as parse from "parse";

Parse.Cloud.beforeSave(EventType,  (request: parse.Cloud.BeforeSaveRequest) => {
    BeforeSave.setArchiveFalse(request);
    BeforeSave.settUserAsOwner(request);


    let EventType = request.object;

    let timesUsed = EventType.get('timesUsed');
    if (!timesUsed) {
        let timesUsedCount = (EventType.has('client')) ? 1000 : 0;
        EventType.set('timesUsed', timesUsedCount);
    } else {
        EventType.increment('timesUsed');
    }

});