var _ = require('lodash');

var handlers = require('../centrals/all');

exports.parse = function(central, alarmMsg) {

    var promise = new Parse.Promise();


    var alarmObject = {};
    _.forEach(handlers, function(handler) {
        if (!alarmObject) {
            alarmObject = handler.parse(central, alarmMsg) || {};
        }
    });

    if (_.isEmpty(alarmObject)) {
        promise.error('Unable to parse alarm, unknown sender');
    } else {
        promise.resolve(Object);
    }


    return promise;
};

