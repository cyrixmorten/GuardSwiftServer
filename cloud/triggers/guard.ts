import {Guard, GuardQuery} from '../../shared/subclass/Guard';
import * as _ from 'lodash';
import { BeforeSave } from './BeforeSave';

Parse.Cloud.beforeSave(Guard,  async (request, response) => {
    BeforeSave.setArchiveFalse(request);
    BeforeSave.settUserAsOwner(request);

    let guard = <Guard>request.object;

    if (_.includes(guard.dirtyKeys(), Guard._alarmNotify) && !guard.alarmNotify) {
        const alarmNotifyCount = await new GuardQuery().
            matchingOwner(guard.owner).
            whereAlarmNotify(true).
            notArchived().
            build().
            count({useMasterKey: true});

        // we are about to remove the last guard being notified about alarms
        if (alarmNotifyCount === 1) {
            response.error(new  Parse.Error(Parse.ErrorCode.VALIDATION_ERROR, 'Must be at least one guard receiving alarms'));
            return;
        }
    }


    response.success();
});