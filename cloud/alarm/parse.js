var _ = require('lodash');

var handlers = require('../centrals/all');

exports.parse = function(alarm, alarmMsg) {

    var promise = new Parse.Promise();

    var alarmObject = {};
    _.forEach(handlers, function(handler) {
        if (_.isEmpty(alarmObject)) {
            alarmObject = handler.parse(alarm, alarmMsg) || {};
        }
    });

    if (_.isEmpty(alarmObject)) {
        promise.error('Unable to parse alarm, unknown sender');
    } else {
        console.log('alarmObject: ', alarmObject);
        promise.resolve(alarmObject);
    }


    return promise;
};

