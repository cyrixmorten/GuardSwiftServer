var moment = require('moment-timezone-all');
var _ = require('lodash');

var pdfUtils = require('../../utils/pdf.js');

var docDefaults = require('./docDefaults.js');
var reportUtils = require('../reportUtils.js');


/**
 * Generate static report doc definition
 *
 * @param report
 * @param settings
 * @param timeZone
 */
exports.createDoc = function (report, settings, timeZone) {

    var districtName = report.get('districtWatchStarted').get('name');
    var events = reportUtils.reportEventsMap(report, timeZone);


    return _.extend(docDefaults.doc(report, timeZone), {
        info: {
            title: districtName + ' ' + moment(report.get('createdAt')).tz(timeZone).format('DD-MM-YYYY'),
            author: 'GuardSwift'
        },
        background: docDefaults.backgroundHeaderImage(settings),

        header: pdfUtils.leftRightAlignedContent({
            textRight: 'Dato: ' + moment(report.get('createdAt')).tz(timeZone).format('DD-MM-YYYY'),
            margin: [10, 10]
        }),

        content: [
            pdfUtils.header(districtName, '', 60),
            pdfUtils.tableNoBorders({
                widths: [50, '*', '*', '*'], // 150, 200, 400],
                content: _.zip(events.arrivedTimestamps, events.arrivedClientAddress, events.arrivedClientNames, events.arrivedGuardNames)
            })
        ],

        footer: docDefaults.footer(report),


        styles: docDefaults.styles()

    });
};