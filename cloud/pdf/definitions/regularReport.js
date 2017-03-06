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




    var reportContent = function() {
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
            content:  _.zip(events.arrivedTimestamps, events.eventName, events.amount, events.people, events.location, events.remarks)
        });

        console.log('reportedEvents: ', reportedEvents);

        // todo: make part of report settings
        // var noEventsText = ;
        
        content.push(header);
        content.push(arrivalAndReportId);
        // if (!_.isEmpty(writtenEvents)) {
            content.push(reportedEvents);

            if (events.writtenByGuard.length == 0){
                content.push(
                    {text: "Ingen uregelmæssigheder blev observeret under tilsynet", margin: [ 0, 10, 0, 0 ]}
                )
            }
        // } else {
        //     content.push(noEventsText);
        // }
        
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
