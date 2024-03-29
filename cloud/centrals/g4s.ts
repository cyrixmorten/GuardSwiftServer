import * as _ from 'lodash';
import { ICentralAlarmHandler } from "./central.interface";

let cpsms = require('../../api/cpsms');

export class G4SCentral implements ICentralAlarmHandler {

    getName() {
        return "G4S";
    }

    matchesCentral(alarmOrCentral) {

        let centralName = alarmOrCentral.has('taskType') ? alarmOrCentral.get('centralName') : alarmOrCentral.get('name');

        return centralName === this.getName();
    };


    parse(central, alarmMsg) {
        if (!this.matchesCentral(central)) {
            return;
        }

        let onMyWayclientNumberAndAlarm = _.split(alarmMsg, ':');
        let statusMsg = _.split(onMyWayclientNumberAndAlarm[0], ',')[0];

        if (statusMsg !== 'På vej' && statusMsg !== 'ANNULERET') {
            throw new Error('Ignoring G4S status chain message')
        }

        let pieces = _.split(onMyWayclientNumberAndAlarm[1], ',');

        return {
            action: _.upperCase(statusMsg) === 'ANNULERET' ? 'abort' : 'create',
            alarmMsg: alarmMsg.substr(alarmMsg.indexOf(",") + 1),
            alarmObject: {
                clientName: _.trim(pieces[0]),
                clientId: _.trim(pieces[1]),
                fullAddress: _.trim(pieces[2]),
                priority: _.trim(pieces[3]),
                signalStatus: _.trim(pieces[4]),
                remarks: _.trim(pieces[5]),
                keybox: _.trim(pieces[6])
            }
        }

    };

    private smsToCentral(alarm, message) {
        this.findGuardMobile(alarm).then(function (mobileNumber) {
            cpsms.send({
                to: alarm.get('sentFrom'),
                from: mobileNumber,
                message: message,
                limit: 160
            });
        });
    };

    private async findGuardMobile(alarm) {
        const sentTo = alarm.get('sentTo');

        try {
            const guard = alarm.get('guard').fetch({useMasterKey: true});

            const mobile = guard.get('mobileNumber');

            return mobile && mobile.length > 6 ? mobile : sentTo;
        } catch (e) {
            return sentTo;
        }
    };

    handlePending(alarm) {
        if (!this.matchesCentral(alarm)) {
            return;
        }

    };

    handleAccepted(alarm) {
        if (!this.matchesCentral(alarm)) {
            return;
        }

        this.smsToCentral(alarm, 'På vej,' + alarm.get('original'));
    };

    handleArrived(alarm) {
        if (!this.matchesCentral(alarm)) {
            return;
        }

        this.smsToCentral(alarm, 'Fremme,' + alarm.get('original'));
    };

    handleAborted(alarm) {
        if (!this.matchesCentral(alarm)) {
            return;
        }

    };

    handleFinished(alarm) {
        if (!this.matchesCentral(alarm)) {
            return;
        }


        this.smsToCentral(alarm, 'Slut,' + alarm.get('original'));
    };
}