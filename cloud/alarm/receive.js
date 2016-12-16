var _ = require('lodash');
var parser = require('./parse');
var createAlarm = require('./create');
var alarmUtils = require('./utils');

Parse.Cloud.define("alarm", function(request, response) {
    handleAlarmRequest(request).then(function(res) {
        response.success(res);
    }).fail(function(error) {
        console.error(error);

        response.error(error);
    })
});

var handleAlarmRequest = function(request) {

    var sender = request.params.sender;
    var receiver = request.params.receiver;
    var alarmMsg = request.params.alarm;

    console.log('-------');
    console.log('sender: ' + sender);
    console.log('receiver: ' + receiver);
    console.log('alarm: ' + alarmMsg);
    console.log('-------');

    if (!sender || !receiver || !alarmMsg) {
        var error = '';
        
        if (!sender) {
            error += 'Missing sender ';
        }
        if (!receiver) {
            error += 'Missing receiver ';
        }
        if (!alarmMsg) {
            error += 'Missing alarm ';
        }
        
        return Parse.Promise.error(error);
    }

    var central, user = {};

    return alarmUtils.findCentral(sender).then(function(centralObj) {
        if (_.isEmpty(centralObj)) {
            return Parse.Promise.error('Unable to find central with sendFrom value: ' + sender);
        }
        central = centralObj;
        console.log('central: ' + central.get('name'));

        return alarmUtils.findUser(receiver);
    }).then(function(userObj) {
        if (_.isEmpty(userObj)) {
            return Parse.Promise.error('Unable to find user with sendTo value: ' + receiver);
        }
        user = userObj;
        console.log('user: ' + user.get('username'));

        return parser.parse(central, alarmMsg);
    }).then(function(parsed) {
        if (parsed.action === 'create') {
            return createAlarm.create({
                sender: sender,
                receiver: receiver,
                central: central,
                user: user,
                parsedAlarm: parsed
            }).then(function() {
                return 'Successfully created alarm';
            });
        }
        if (parsed.action === 'abort') {
            return alarmUtils.findAlarm(central, user, parsed).then(function(alarm) {
                alarm.set('status', 'aborted');
                return alarm.save({useMasterKey: true});
            }).then(function() {
                return 'Alarm aborted';
            });

        }
    })


};




