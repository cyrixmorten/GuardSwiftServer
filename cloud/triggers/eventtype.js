/*
 * Auto set timesUsed to 0 if not defined
 */
Parse.Cloud.beforeSave("EventType", function (request, response) {
    var EventType = request.object;

    var timesUsed = EventType.get('timesUsed');
    if (!timesUsed) {
        var timesUsedCount = (EventType.has('client')) ? 1000 : 0;
        EventType.set('timesUsed', timesUsedCount);
    } else {
        EventType.increment('timesUsed');
    }

    response.success();
});