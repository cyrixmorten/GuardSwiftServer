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

    var backgroundHeaderImage = docDefaults.backgroundHeaderImage(settings);

    var eventsContent = function () {

        var pruneIndexes = [];


        var missingEventName = function() {
            for (var i = 0; i<events.eventTimestamps.length; i++) {
                var hasEventName = !!events.eventName[i];
                if (!hasEventName) {
                    pruneIndexes.push(i);
                }
            }
        };

        /*
         * Alarms can be accepted by multiple guards, however there is no reason to write it more than once in the report
         */
        var onlyWriteAcceptOnce = function() {
            var hasAccepted = false;
            for (var i = 0; i<events.eventTimestamps.length; i++) {

                if (events.taskEvents[i] === 'ACCEPT') {
                    if (hasAccepted === true) {
                        pruneIndexes.push(i);
                    }
                    hasAccepted = true;
                }
            }
        };

        var preferArrivalsWithinSchedule = function() {
            var regularTask = report.get('circuitUnit');
            if (!regularTask) {
                return;
            }

            var supervisions = regularTask.get('supervisions');
            var arrivalEvents = [];

            // collect arrival events
            for (var i = 0; i<events.eventTimestamps.length; i++) {
                if (events.taskEvents[i] === 'ARRIVE') {
                    arrivalEvents.push({
                        event: events.all[i],
                        index: i
                    });
                }
            }

            var extraArrivalsCount = arrivalEvents.length - supervisions;

            if (extraArrivalsCount > 0) {

                var pruneCount = 0;

                var pruneExtraArrivals = function(ignoreSchedule) {
                    for (var j = 0; j<arrivalEvents.length; j++) {
                        var arrivalEvent = arrivalEvents[j];

                        var isWithinSchedule = arrivalEvent.event.get('withinSchedule');
                        var pruneDueToSchedule = ignoreSchedule || !isWithinSchedule;
                        if (pruneDueToSchedule && pruneCount !== extraArrivalsCount) {
                            pruneIndexes.push(arrivalEvent.index);
                            pruneCount++;
                        }
                    }
                };


                pruneExtraArrivals();
                pruneExtraArrivals(true);

            }
        };

        var removeDuplicateTexts = function() {

            // 1) collect comparables with concatenated text
            var comparables = [];
            for (var i = 0; i<events.eventName.length; i++) {

                var event = events.eventName[i];

                if (event) {
                    var amount = events.amount[i];
                    var people = events.people[i];
                    var location = events.location[i];
                    var remarks = events.remarks[i];

                    comparables.push({
                        text: _.join(_.compact([event, amount, people, location, remarks]), "_"),
                        index: i,
                        timestamp: events.all[i].get('deviceTimestamp')
                    });
                }
            }

            // 2) collect duplicates
            var seenTexts = [];
            var duplicates = [];
            _.forEach(comparables, function(comparable) {

                if (_.includes(seenTexts, comparable.text)) {
                    duplicates.push(comparable);
                }

                seenTexts.push(comparable.text);
            });

            // 3) inspect time distance between duplicates
            _.forEach(duplicates, function(duplicate) {

                var duplicateTimestamp = moment(duplicate.timestamp);


                var matchingComparables = _.filter(comparables, function(comparable) {
                    var match = comparable.text === duplicate.text;
                    var isBefore = moment(comparable.timestamp).isBefore(duplicateTimestamp);

                    return match && isBefore;
                });

                var prune = false;
                _.forEach(matchingComparables, function(comparable) {
                    var diffMinutes = moment(comparable.timestamp).diff(duplicateTimestamp, 'minutes');

                    if (diffMinutes < 15) {
                        prune = true;
                    }
                });

                if (prune) {
                    pruneIndexes.push(duplicate.index);
                }
            })

        };

        missingEventName();
        onlyWriteAcceptOnce();
        preferArrivalsWithinSchedule();
        removeDuplicateTexts();

        // uniq in case multiple strategies apply to same index
        pruneIndexes = _.uniq(pruneIndexes);

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
