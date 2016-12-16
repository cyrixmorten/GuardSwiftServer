var _ = require('lodash');
var cpsms = require('../../api/cpsms');

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

    response.success();

});

Parse.Cloud.afterSave("Task", function (request) {
    alarmUpdate(request.object);
    // var task = request.object;
    //
    // var isAlarmTask = task.get('taskType') === 'Alarm';
    // var isPending = task.get('status') === 'pending';
    //
    // if (isAlarmTask && isPending && !_.includes(task.get('knownStatus'), states.PENDING)) {
    //     sendNotification(task);
    // }
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

    var sendPushNotification = function() {
        var installationQuery = new Parse.Query(Parse.Installation);
        installationQuery.equalTo('owner', alarm.get('owner'));
        installationQuery.equalTo('channels', 'alarm');

        Parse.Push.send({
            where: installationQuery,
            expiration_time: 600000,
            data: {
                alarmId: alarm.id
            }
        }, { useMasterKey: true });
    };

    var sendSMS = function () {
        var prefix = alarm.get('status') === states.ABORTED ? 'ANNULERET\n' : '';

        var guardQuery = new Parse.Query("Guard");
        guardQuery.equalTo('owner', alarm.get('owner'));
        guardQuery.equalTo('alarmNotify', true);
        guardQuery.equalTo('alarmSMS', true);
        guardQuery.exists('mobileNumber', true);
        guardQuery.each(function (guard) {
            cpsms.send({
                to: guard.get("mobileNumber"),
                message: prefix + alarm.get("original")
            });
        }, { useMasterKey: true });
    };

    sendPushNotification();
    // sendSMS();
};

var alarmUpdate = function(task) {
    // var statusChange = task.dirty('status');
    var isAlarmTask = task.get('taskType') === 'Alarm';


    var status = task.get('status');

    if (isAlarmTask && /*statusChange &&*/ !_.includes(task.get('knownStatus'), status)) {

        switch (status) {
            case states.PENDING: {

                sendNotification(task);

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

                sendNotification(task);

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

        task.addUnique('knownStatus', status);
        task.save(null, {useMasterKey: true});
    }
};