var _ = require('lodash');

var handlers = require('../centrals/all');

var states = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    ARRIVED: 'arrived',
    ABORTED: 'aborted',
    FINISHED: 'finished'
};

Parse.Cloud.beforeSave("Task", function (request, response) {
    
    var task = request.object;

    if (task.isNew()) {
        exports.reset(task);
    }

    alarmUpdate(task);

    response.success();
    
});

exports.reset = function(task) {
    task.set('status', states.PENDING);
    task.set('timeStarted', new Date(1970));
    task.set('timeEnded', new Date(1970));
};

var alarmUpdate = function(task) {
    var statusChanges = Task.dirty(task);
    var isAlarmTask = task.get('taskType') === 'Alarm';

    if (isAlarmTask && statusChanges) {
        switch (task.get('status')) {
            case states.ACCEPTED: {
                _.forEach(handlers, function(handler) {
                    handler.handleAccepted(task);
                })
            }
        }
    }
};