/*
 * Auto set timesUsed to 0 if not defined
 */
import { BeforeSave } from './common/beforeSave';

Parse.Cloud.beforeSave("EventType", function (request, response) {
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