import { User } from '../../shared/subclass/User';

Parse.Cloud.beforeSave(Parse.User,  (request) => {
    let user = request.object as Parse.User;

    if (!user.existed()) {
        if (!user.has(User._timeZone)) {
            // TODO investigate removal
            user.set(User._timeZone, 'Europe/Copenhagen');
        }
    }
});