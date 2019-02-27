import { BeforeSave } from './BeforeSave';

Parse.Cloud.beforeSave("EventType", function (request, response) {
    BeforeSave.setArchiveFalse(request);
    BeforeSave.settUserAsOwner(request);

    if (!request.user) {
        // not saved by user
        response.success();
        return;
    }

    let EventType = request.object;

    let timesUsed = EventType.get('timesUsed');
    if (!timesUsed) {
        let timesUsedCount = (EventType.has('client')) ? 1000 : 0;
        EventType.set('timesUsed', timesUsedCount);
    } else {
        EventType.increment('timesUsed');
    }

    response.success();
});