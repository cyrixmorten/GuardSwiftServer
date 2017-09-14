
Parse.Cloud.beforeSave("EventLog",  (request, response) => {

    let EventLog = request.object;

    // avoid 'undefined' for automatic
    let automatic = EventLog.has('automatic');
    console.log('hasAutomatic: ', automatic);
    if (!automatic) {
        EventLog.set('automatic', false);
    }

    response.success();


});

Parse.Cloud.afterSave("EventLog", (request) => {

    let EventLog = request.object;

    // wrieEventToSession(EventLog);
    writeEventToReport(EventLog);


});


let writeEventToReport = (EventLog) => {


    let reportNotFoundError = new Error('Report not found');


    let findReport =  (reportId) => {

        console.log('findReport reportId: ' + reportId);

        let query = new Parse.Query('Report');
        query.equalTo('reportId', reportId);

        return query.first({ useMasterKey: true });
    };

    let writeEvent =  (report) => {
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

    let createReport =  () => {
        console.log('createReport');

        let Report = Parse.Object.extend('Report');
        let report = new Report();

        Object.keys(EventLog.attributes).forEach( (fieldName) => {
            report.set(fieldName, EventLog.get(fieldName));
        });



        return report.save(null, { useMasterKey: true });
    };

    let reportId = EventLog.get('reportId');

    if (reportId && !EventLog.get('reported')) {
        findReport(reportId)
        .then((report) => {
            if (report) {
                console.log('Found report: ' + report.id );
                return writeEvent(report);
            }

            console.log('No report found');

            return createReport()
                .then(writeEvent)
                .fail((error) => {
                    console.error('Error while creating report: ' + JSON.stringify(error))
                    return error;
                });
        }, (error)  => {
            console.error('Unhandled error: ' + JSON.stringify(error));
        })
    } else {
        if (reportId) {
            console.log('Already written to report');
        } else {
            console.log('Not a report event');
        }
    }

};