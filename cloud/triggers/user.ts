import { User } from '../../shared/subclass/User';

Parse.Cloud.beforeSave(User,  (request) => {
    let user = request.object as User;

    if (!user.existed()) {
        if (!user.timeZone) {
            // TODO investigate removal
            user.timeZone =  'Europe/Copenhagen';
        }
    }
});