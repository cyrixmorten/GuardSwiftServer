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

Parse.Cloud.afterSave("Task", function (request) {
    var task = request.object;

    var isAlarmTask = task.get('taskType') === 'Alarm';
    var isPending = task.get('status') === 'pending';

    if (isAlarmTask && isPending) {
        sendNotification(task);
    }
});

exports.reset = function(task) {
    var isAlarmTask = task.get('taskType') === 'Alarm';

    task.set('status', states.PENDING);
    if (isAlarmTask) {
        task.set('timeStarted', new Date());
    } else {
        task.set('timeStarted', new Date(1970));
        task.set('timeEnded', new Date(1970));
    }

};

var sendNotification = function(alarm) {

    var query = new Parse.Query(Parse.Installation);
    query.equalTo('owner', alarm.get('owner'));

    Parse.Push.send({
        where: query,
        expiration_time: 600000,
        data: {
            alarmId: alarm.id
        }
    }, { useMasterKey: true });
};

var alarmUpdate = function(task) {
    var statusChange = task.dirty('status');
    var isAlarmTask = task.get('taskType') === 'Alarm';

    console.log('isAlarmTask: ', isAlarmTask);
    console.log('statusChange: ', statusChange, task.get('status'));

    if (isAlarmTask && statusChange) {
        switch (task.get('status')) {
            case states.PENDING: {

                _.forEach(handlers, function(handler) {
                    handler.handlePending(task);
                });
                break;
            }
            case states.ACCEPTED: {
                _.forEach(handlers, function(handler) {
                    handler.handleAccepted(task);
                });
                break;
            }
            case states.ARRIVED: {
                _.forEach(handlers, function(handler) {
                    handler.handleArrived(task);
                });
                break;
            }
            case states.ABORTED: {
                _.forEach(handlers, function(handler) {
                    handler.handleAborted(task);
                });
                break;
            }
            case states.FINISHED: {
                _.forEach(handlers, function(handler) {
                    handler.handleFinished(task);
                });
                break;
            }
        }
    }
};