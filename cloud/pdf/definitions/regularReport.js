var moment = require('moment-timezone-all');
var _ = require('lodash');

var pdfUtils = require('../../utils/pdf.js');


var docDefaults = require('./docDefaults.js');
var reportUtils = require('../reportUtils.js');


/**
 * Generate regular report doc definition
 *
 * @param report
 * @param settings
 * @param timeZone
 */
exports.createDoc = function (report, settings, timeZone) {

    var events = reportUtils.reportEventsMap(report, timeZone);

    // var arrivalTimestamps = function () {
    //     if (_.isEmpty(events.arrivedTimestamps)) {
    //         return '';
    //     }
    //
    //     var arrivals = '';
    //     var delimiter = ', ';
    //     _.each(events.arrivedTimestamps, function (timestamp) {
    //         arrivals += timestamp + delimiter;
    //     });
    //
    //     return _.trimEnd(arrivals, delimiter);
    // };

    var backgroundHeaderImage = docDefaults.backgroundHeaderImage(settings);

    var eventsContent = function () {


        var pruneIndexes = [];
        for (var i = 0; i<events.eventTimestamps.length; i++) {
            var hasEventName = !!events.eventName[i];
            if (!hasEventName) {
                pruneIndexes.push(i);
            }
        }


        _.pullAt(events.eventTimestamps, pruneIndexes);
        _.pullAt(events.eventName, pruneIndexes);
        _.pullAt(events.amount, pruneIndexes);
        _.pullAt(events.people, pruneIndexes);
        _.pullAt(events.location, pruneIndexes);
        _.pullAt(events.remarks, pruneIndexes);


        return _.zip(events.eventTimestamps, events.eventName, events.amount, events.people, events.location, events.remarks);
    };

    var reportContent = function () {
        var content = [];

        // client info
        var header = docDefaults.contentHeader(report, backgroundHeaderImage);
        var arrivalAndReportId = pdfUtils.leftRightAlignedContent({
            textLeft: [],
            // textLeft: ['Vægter var ved adressen kl: ', {text: arrivalTimestamps(), bold: true}],
            textRight: [{text: 'Rapport id: ' + report.get('reportId'), color: 'grey'}],
            margin: [0, 10],
            style: {bold: true}
        });
        var reportedEvents = pdfUtils.tableWithBorder({
            widths: [50, '*', 25, '*', '*', '*'],
            header: ['Tidspunkt', 'Hændelse', 'Antal', 'Personer', 'Placering', 'Bemærkninger'],
            content: eventsContent()
        });

        content.push(header);
        content.push(arrivalAndReportId);
        content.push(reportedEvents);

        var eventsWrittenbyGuard = _.compact(events.writtenByGuard);
        if (eventsWrittenbyGuard.length == 0) {
            content.push(
                {text: "Ingen uregelmæssigheder blev observeret under tilsynet", margin: [0, 10, 0, 0]}
            )
        }

        return content;
    };
    return _.extend(docDefaults.doc(report, timeZone), {
        background: backgroundHeaderImage,
        header: docDefaults.header(report, timeZone),
        content: reportContent(),
        footer: docDefaults.footer(report),
        styles: docDefaults.styles()
    });
};
