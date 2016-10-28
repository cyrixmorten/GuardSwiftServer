
Parse.Cloud.beforeSave("EventLog", function (request, response) {

    var EventLog = request.object;

    // avoid 'undefined' for automatic
    var automatic = EventLog.get('automatic');
    if (!automatic) {
        EventLog.set('automatic', false);
    }

    response.success();


});

Parse.Cloud.afterSave("EventLog", function (request) {

    var EventLog = request.object;

    var appVersion = EventLog.get('gsVersion');
    if (appVersion < 318) {
        console.log('App version too low for cloud code report handling', 'version:' + appVersion, 'expected: >=318');
        response.success();
        return;
    }

    var reportNotFoundError = new Error('Report not found');

    var getReportId = function () {
        if (EventLog.has('staticTask')) {
            return EventLog.get('client').id + EventLog.get('staticTask').id
        }
        if (EventLog.has('circuitUnit')) {
            return EventLog.get('circuitStarted').id + EventLog.get('circuitUnit').id
        }
        if (EventLog.has('districtWatchClient')) {
            // combine all district watch events for a group
            return EventLog.get('districtWatchStarted').id
        }
    };


    var findReport = function () {
        var reportId = getReportId();


        if (!reportId) {
            throw new Error('Unable to get reportId')
        }

        var Report = Parse.Object.extend('Report');
        var query = new Parse.Query(Report);
        query.equalTo('reportId', reportId);

        return query.first().then(function (report) {
            console.log('found report: ' + JSON.stringify(report));
            return (report) ? report : Parse.Promise.error(reportNotFoundError);
        });
    };

    var writeEvent = function (report) {
        console.log('Writing event to report: ' + report.id);
        console.log('At client:  ' + report.get('clientAddress'));

        if (EventLog.get('eventCode') === 105) {
            report.set('extraTimeSpent', EventLog.get('amount'));
        }

        EventLog.set('reported', true);

        report.addUnique('eventLogs', EventLog);
        report.increment('eventCount');

        return report.save();
    };

    var createReport = function () {
        console.log('createReport');

        var Report = Parse.Object.extend('Report');
        var report = new Report();

        Object.keys(EventLog.attributes).forEach(function (fieldName) {
            report.set(fieldName, EventLog.get(fieldName));
        });



        return report.save();
    };

    if (!EventLog.get('reported')) {
        findReport()
            .then(writeEvent)
            .fail(function (error) {
                if (error === reportNotFoundError) {
                    return createReport()
                        .then(writeEvent)
                        .fail(function(error) {
                            console.error('Error while creating report: ' + JSON.stringify(error))
                            return error;
                        });
                }
                return new Parse.Promise.as('Not a report event');
            })
    } else {
        console.log('Already written to report');
    }

});