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

    var arrivalTimestamps = function () {
        if (_.isEmpty(events.arrivedTimestamps)) {
            return '';
        }

        var arrivals = '';
        var delimiter = ', ';
        _.each(events.arrivedTimestamps, function (timestamp) {
            arrivals += timestamp + delimiter;
        });

        return _.trimEnd(arrivals, delimiter);
    };

    var backgroundHeaderImage = docDefaults.backgroundHeaderImage(settings);


    var uniqueEvents = function () {
        var combinedContent = [];
        for (var i = 0; i < events.eventName.length; i++) {
            combinedContent.push(
                events.eventName[i] +
                events.amount[i] +
                events.people[i] +
                events.location[i] +
                events.remarks[i]
            )
        }


        var uniqueContent = [];
        for (var j = 0; j < combinedContent.length; j++) {
            if (!_.includes(uniqueContent, combinedContent[j])) {
                uniqueContent.push(combinedContent[j]);
            } else if (!_.isEmpty(combinedContent[j])) {
                // strip of duplicate from events
                events.eventName.splice(j, 1);
                events.amount.splice(j, 1);
                events.people.splice(j, 1);
                events.location.splice(j, 1);
                events.remarks.splice(j, 1);
            }
        }


        return _.zip(events.eventName, events.amount, events.people, events.location, events.remarks);
    };


    return _.extend(docDefaults.doc(report, timeZone), {

        background: backgroundHeaderImage,

        header: docDefaults.header(report, timeZone),

        content: [
            docDefaults.contentHeader(report, backgroundHeaderImage),
            pdfUtils.leftRightAlignedContent({
                textLeft: ['Vægter var ved adressen kl: ', {text: arrivalTimestamps(), bold: true}],
                textRight: [{text: 'Rapport id: ' + report.get('reportId'), color: 'grey'}],
                margin: [0, 10],
                style: {bold: true}
            }),
            pdfUtils.tableBorderedWithHeader({
                widths: ['*', 50, '*', '*', '*'],
                header: ['Hændelse', 'Antal', 'Personer', 'Placering', 'Bemærkninger'],
                content: uniqueEvents()
            })
        ],

        footer: docDefaults.footer(report),


        styles: docDefaults.styles()

    });
};
