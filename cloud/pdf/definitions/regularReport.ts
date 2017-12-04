import * as moment from 'moment-timezone-all';
import * as _ from 'lodash';

import {ReportUtils} from "../reportUtils";
import {PDFUtils} from "../../utils/pdf";
import {PDFDefaults} from "./docDefaults";
import {TaskType} from "../../../shared/subclass/Task";
import {Report} from "../../../shared/subclass/Report";
import {ReportSettings} from "../../../shared/subclass/ReportSettings";



/**
 * Generate regular report doc definition
 *
 * @param report
 * @param settings
 * @param timeZone
 */
export let createDoc =  (report: Report, settings: ReportSettings, timeZone)  => {

    let events = ReportUtils.reportEventsMap(report, timeZone);

    let backgroundHeaderImage = PDFDefaults.backgroundHeaderImage(settings);

    let eventsContent =  () => {

        let pruneIndexes = [];


        let missingEventName = () => {
            for (let i = 0; i<events.eventTimestamps.length; i++) {
                let hasEventName = !!events.eventName[i];
                if (!hasEventName) {
                    pruneIndexes.push(i);
                }
            }
        };

        /*
         * Alarms can be accepted by multiple guards, however there is no reason to write it more than once in the report
         */
        let onlyWriteAcceptOnce = () => {
            let hasAccepted = false;
            for (let i = 0; i<events.eventTimestamps.length; i++) {

                if (events.taskEvents[i] === 'ACCEPT') {
                    if (hasAccepted === true) {
                        pruneIndexes.push(i);
                    }
                    hasAccepted = true;
                }
            }
        };

        let preferArrivalsWithinSchedule = () => {

            if (!report.matchingTaskType(TaskType.REGULAR, TaskType.RAID)) {
                return;
            }

            let regularTask = report.task;

            let supervisionsCount = regularTask.get('supervisions');
            let arrivalEvents = [];

            // collect arrival events
            for (let i = 0; i<events.eventTimestamps.length; i++) {
                if (events.taskEvents[i] === 'ARRIVE') {
                    arrivalEvents.push({
                        event: events.all[i],
                        index: i
                    });
                }
            }

            let extraArrivalsCount = arrivalEvents.length - supervisionsCount;

            if (extraArrivalsCount > 0) {

                let pruneCount = 0;

                let pruneExtraArrivals = (ignoreSchedule) => {
                    for (let j = 0; j<arrivalEvents.length; j++) {
                        let arrivalEvent = arrivalEvents[j];

                        let isWithinSchedule = arrivalEvent.event.get('withinSchedule');
                        let pruneDueToSchedule = ignoreSchedule || !isWithinSchedule;
                        if (pruneDueToSchedule && pruneCount !== extraArrivalsCount) {
                            pruneIndexes.push(arrivalEvent.index);
                            pruneCount++;
                        }
                    }
                };


                pruneExtraArrivals(false);
                pruneExtraArrivals(true);

            }
        };

        let removeDuplicateTexts = () => {

            // 1) collect comparables with concatenated text
            let comparables = [];
            for (let i = 0; i<events.eventName.length; i++) {

                let event = events.eventName[i];


                // only compare events written by guard
                if (events.taskEvents[i] !== 'OTHER') {
                    continue;
                }

                if (event) {
                    let amount = events.amount[i];
                    let people = events.people[i];
                    let location = events.location[i];
                    let remarks = events.remarks[i];

                    comparables.push({
                        text: _.join(_.compact([event, amount, people, location, remarks]), "_"),
                        index: i,
                        timestamp: events.all[i].get('deviceTimestamp')
                    });
                }
            }

            // 2) collect duplicates
            let seenTexts = [];
            let duplicates = [];
            _.forEach(comparables, (comparable) => {

                if (_.includes(seenTexts, comparable.text)) {
                    duplicates.push(comparable);
                }

                seenTexts.push(comparable.text);
            });

            // 3) inspect time distance between duplicates
            _.forEach(duplicates, (duplicate) => {

                let duplicateTimestamp = moment(duplicate.timestamp);


                let matchingComparables = _.filter(comparables, (comparable) => {
                    let match = comparable.text === duplicate.text;
                    let isBefore = moment(comparable.timestamp).isBefore(duplicateTimestamp);

                    return match && isBefore;
                });

                let prune = false;
                _.forEach(matchingComparables, (comparable) => {
                    let diffMinutes = moment(comparable.timestamp).diff(duplicateTimestamp, 'minutes');

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
        _.pullAt(events.guardInitials, pruneIndexes);


        return {
            guardInitials: events.guardInitials,
            eventTimestamps: events.eventTimestamps,
            eventNames: events.eventName,
            amounts: events.amount,
            people: events.people,
            locations: events.location,
            remarks: events.remarks,
            length: events.remarks.length // can pick either, all same length
        };

    };

    let reportContent =  () => {
        let content = [];

        // client info
        let header = PDFDefaults.contentHeader(report, backgroundHeaderImage);
        let arrivalAndReportId = PDFUtils.leftRightAlignedContent({
            textLeft: [],
            textRight: [{text: 'Rapport id: ' + report.get('reportId'), color: 'grey'}],
            margin: [0, 10],
            style: {bold: true}
        });

        let eventContents = eventsContent();
        let tableContent = [];
        for (let i = 0; i < eventContents.length; i++) {
            let baseRow = [
                eventContents.guardInitials[i],
                eventContents.eventTimestamps[i],
                eventContents.eventNames[i],
                eventContents.amounts[i],
                eventContents.people[i],
                eventContents.locations[i]
            ];

            tableContent.push(baseRow);

            let remarks = eventContents.remarks[i];
            if (!_.isEmpty(remarks)) {
                tableContent.push(['','', {text: remarks, colSpan: 4, fillColor: '#eeeeee'}]);
            }
        }



        let reportedEvents = PDFUtils.table({
            widths: [30, 50, 75, 30, '*', '*'],
            header: ['Vagt', 'Tidspunkt', 'Hændelse', 'Antal', 'Personer', 'Placering'], // TODO translate
            content: tableContent,
            layout: "headerLineOnly"
        });

        content.push(header);
        content.push(arrivalAndReportId);
        content.push(reportedEvents);

        let eventsWrittenbyGuard = _.compact(events.writtenByGuard);
        if (eventsWrittenbyGuard.length === 0) {
            content.push(
                {text: "Ingen uregelmæssigheder blev observeret under tilsynet", margin: [0, 10, 0, 0]}
            )
        }

        return content;
    };
    return _.extend(PDFDefaults.doc(report, timeZone), {
        background: backgroundHeaderImage,
        header: PDFDefaults.header(report, timeZone),
        content: reportContent(),
        footer: PDFDefaults.footer(report),
        styles: PDFDefaults.styles()
    });
};