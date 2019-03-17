import { User } from '../../shared/subclass/User';

Parse.Cloud.beforeSave(User,  (request) => {
    let user = request.object as User;

    if (!user.timeZone) {
        user.timeZone = 'Europe/Copenhagen';
    }
});