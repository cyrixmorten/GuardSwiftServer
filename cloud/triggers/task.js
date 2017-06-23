var _ = require('lodash');
var moment = require('moment');
var cpsms = require('../../api/cpsms');

var handlers = require('../centrals/all');

var states = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    ARRIVED: 'arrived',
    ABORTED: 'aborted',
    FINISHED: 'finished'
};

exports.states = states;

Parse.Cloud.beforeSave("Task", function (request, response) {
    
    var task = request.object;

    if (task.isNew()) {
        exports.reset(task);
    }

    response.success();

});

Parse.Cloud.afterSave("Task", function (request) {
    alarmUpdate(request.object);
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

    console.log('sendNotification alarm', alarm.id);

    var sendPushNotification = function() {
        console.log('sendPushNotification');

        var installationQuery = new Parse.Query(Parse.Installation);
        installationQuery.equalTo('owner', alarm.get('owner'));
        installationQuery.equalTo('channels', 'alarm');
        installationQuery.greaterThan('updatedAt', moment().subtract(7, 'days').toDate());

        return installationQuery.find({ useMasterKey: true }).then(function(installations) {
            console.log('Sending push to installations', installations.length);
            _.forEach(installations, function(installation) {
                console.log('installation: ', installation.get('name'), installation.id);
            })
        }).then(function() {
            return Parse.Push.send({
                where: installationQuery,
                expiration_interval: 600,
                data: {
                    alarmId: alarm.id
                }
            }, { useMasterKey: true })
            .then(function() {
                console.log('Push notification successfully sent for alarm', alarm.id);
            }).fail(function(e) {
                console.error('Error sending push notification', e);
            });
        });
    };

    var sendSMS = function () {
        var prefix = alarm.get('status') === states.ABORTED ? 'ANNULERET\n' : '';

        var Guard = Parse.Object.extend("Guard");
        var guardQuery = new Parse.Query(Guard);
        guardQuery.equalTo('owner', alarm.get('owner'));
        guardQuery.equalTo('alarmSMS', true);
        guardQuery.include('installation');
        return guardQuery.find({ useMasterKey: true }).then(function (guards) {
            console.log('Sending SMS for alarm:', alarm.id, ' to ', guards.length, 'guards');

            console.log('guards: ', guards);

            var smsPromises = [];

            _.forEach(guards, function(guard) {
                var installation = guard.get('installation');
                var guardMobile = guard.get('mobileNumber');
                var installationMobile = installation ? installation.get('mobileNumber') : '';

                console.log('Sending to',  guard.get('name'), guardMobile, installationMobile);

                if (guardMobile || installationMobile) {
                    var sendTo = (installationMobile) ? installationMobile : guardMobile;

                    var smsPromise = cpsms.send({
                        to: sendTo,
                        message: prefix + alarm.get("original"),
                        flash: true
                    });

                    smsPromises.push(smsPromise)
                } else {
                    console.error('Unable to send SMS to guard', guard.get('name'), 'no mobile number for installation or guard');
                }
            });

            return Parse.Promise.when(smsPromises);
        });
    };


    return sendPushNotification().always(function() {
        return sendSMS()
    });
};

var alarmUpdate = function(task) {
    var isAlarmTask = task.get('taskType') === 'Alarm';


    var status = task.get('status');

    if (isAlarmTask && !_.includes(task.get('knownStatus'), status)) {

        switch (status) {
            case states.PENDING: {

                _.forEach(handlers, function(handler) {
                    handler.handlePending(task);
                });

                sendNotification(task).then(function() {
                    console.log('Done sending notification for alarm', task.id);
                }).fail(function(e) {
                    console.error('Error sending notigication for alarm', task.id, e);
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