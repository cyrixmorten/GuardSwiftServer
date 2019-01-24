import * as parse from 'parse';

export class BeforeSaveUtils {

    public static settUserAsOwner = (request: parse.Cloud.BeforeSaveRequest) => {
        if (!request.object.get('owner') && request.user) {
            request.object.set('owner', request.user);
        }
    }

}