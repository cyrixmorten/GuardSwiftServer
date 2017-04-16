var _ = require('lodash');
var fs = require('fs');
var moment = require('moment');
var json2csv = require('json2csv');


Parse.Cloud.define("alarmsToCsv", function (request, response) {

    exports.fetch().then(function (alarms) {
        return exports.csv(alarms);
    }).then(function(csv) {

        fs.writeFileSync('file.csv', csv, function(err) {
            if (err) {
                console.error(error);
                return;
            }
            console.log('file saved');
        });

        response.success(csv);
    })
    .fail(function (error) {
        console.error(error);

        response.error(error);
    })
});

exports.fetch = function(user, dateFrom, dateTo) {
    return new Parse.Query("Task").limit(1000).find({useMasterKey: true});
};

exports.csv = function(alarms) {
    var fields = ['Central', 'Dato', 'Modtaget', 'Id', 'Navn', 'Adresse', 'Prioritet', 'Status', 'Alarm'];

    var centralGroups = _.groupBy(alarms, function(alarm) {
        return alarm.get('centralName');
    });

    var alarmEntries = [];


    _.forOwn(centralGroups, function(alarms, centralName) {

        alarms = _.sortBy(alarms, function(alarm) {
            return alarm.get('fullAddress');
        });

        var entries = _.map(alarms, function(alarm) {

            var getStatus = function() {
                var status = alarm.get('status');

                switch (status) {
                    case 'pending': return 'Afventer';
                    case 'accepted': return 'Accepteret';
                    case 'aborted': return 'Afbrudt';
                    case 'finished': return 'Afsluttet';
                }
            };

            var getPriority = function() {
                var priotity = alarm.get('priority');

                return _.includes(priotity, ' ') ? '?' : priotity;
            };

            return {
                'Central': centralName,
                'Dato': moment(alarm.createdAt).format('DD/MM/YYYY'),
                'Modtaget': moment(alarm.createdAt).format('HH:mm'),
                'Id': alarm.get('clientId'),
                'Navn': alarm.get('name'),
                'Adresse': alarm.get('fullAddress'),
                'Prioritet': getPriority(),
                'Status': getStatus(),
                'Alarm': alarm.get('original')
            }
        });


        alarmEntries.push(entries);

    });


    var promise = new Parse.Promise();

    try {
        var csv = json2csv({ data: _.flatten(alarmEntries), fields: fields});
        promise.resolve(csv);
    } catch(err) {
        promise.error(err);
    }

    return promise;

};