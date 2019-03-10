import {Guard, GuardQuery} from '../../shared/subclass/Guard';
import * as _ from 'lodash';
import { BeforeSave } from './BeforeSave';
import * as parse from "parse";

Parse.Cloud.beforeSave(Guard,  async (request: parse.Cloud.BeforeSaveRequest) => {
    BeforeSave.setArchiveFalse(request);
    BeforeSave.settUserAsOwner(request);

    let guard = request.object as Guard;

    if (_.includes(guard.dirtyKeys(), Guard._alarmNotify) && !guard.alarmNotify) {
        const alarmNotifyCount = await new GuardQuery().
            matchingOwner(guard.owner).
            whereAlarmNotify(true).
            build().
            count({useMasterKey: true});

        // we are about to remove the last guard being notified about alarms
        if (alarmNotifyCount === 1) {
            throw 'Must be at least one guard receiving alarms';
        }
    }
});