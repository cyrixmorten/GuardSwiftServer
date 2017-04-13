
// Parse.Cloud.beforeSave("EventLog", function (request, response) {
//
//     var EventLog = request.object;
//
//     // avoid 'undefined' for automatic
//     var automatic = EventLog.get('automatic');
//     if (!automatic) {
//         EventLog.set('automatic', false);
//     }
//
//     response.success();
//
//
// });

Parse.Cloud.afterSave("EventLog", function (request) {

    var EventLog = request.object;

    // wrieEventToSession(EventLog);
    writeEventToReport(EventLog);


});

// remove ->
// var wrieEventToSession = function(EventLog) {
//     var eventCode = EventLog.get('eventCode');
//     if (eventCode == 200 || eventCode == 201) {
//
//         Parse.Session.current().then(function(session) {
//             var guard = undefined;
//             if (eventCode == 200) {
//                 guard = EventLog.get('guard');
//                 console.log('Adding guard to session: ' + EventLog.get('guard'));
//             } else {
//                 console.log('Removing guard from session ' + EventLog.get('guard'));
//             }
//             session.set('guard', guard);
//             session.save();
//         });
//     }
// };

var writeEventToReport = function(EventLog) {


    var reportNotFoundError = new Error('Report not found');

    // var getReportId = function () {
    //     if (EventLog.has('staticTask')) {
    //         return EventLog.get('client').id + EventLog.get('staticTask').id
    //     }
    //     if (EventLog.has('circuitUnit')) {
    //         return EventLog.get('circuitStarted').id + EventLog.get('circuitUnit').id
    //     }
    //     if (EventLog.has('districtWatchClient')) {
    //         // combine all district watch events for a group
    //         return EventLog.get('districtWatchStarted').id
    //     }
    // };


    var findReport = function (reportId) {

        console.log('findReport reportId: ' + reportId);

        var query = new Parse.Query('Report');
        query.equalTo('reportId', reportId);

        return query.first({ useMasterKey: true });
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

        return report.save(null, { useMasterKey: true });
    };

    var createReport = function () {
        console.log('createReport');

        var Report = Parse.Object.extend('Report');
        var report = new Report();

        Object.keys(EventLog.attributes).forEach(function (fieldName) {
            report.set(fieldName, EventLog.get(fieldName));
        });



        return report.save(null, { useMasterKey: true });
    };

    var reportId = EventLog.get('reportId');

    if (reportId && !EventLog.get('reported')) {
        findReport(reportId)
        .then(function(report) {
            if (report) {
                console.log('Found report: ' + report.id );
                return writeEvent(report);
            }

            console.log('No report found');

            return Parse.Promise.error(reportNotFoundError);
        })
        .fail(function (error) {
            if (error === reportNotFoundError) {
                return createReport()
                .then(writeEvent)
                .fail(function(error) {
                    console.error('Error while creating report: ' + JSON.stringify(error))
                    return error;
                });
            } else {
                console.error('Unhandled error: ' + JSON.stringify(error));
            }
        })
    } else {
        if (reportId) {
            console.log('Already written to report');
        } else {
            console.log('Not a report event');
        }
    }

};