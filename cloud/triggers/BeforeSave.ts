import * as parse from 'parse';
import { BaseClass } from '../../shared/subclass/BaseClass';


export class BeforeSave {

    public static setArchiveFalse(request: parse.Cloud.BeforeSaveRequest) {
        if (!request.object.has(BaseClass._archive)) {
            request.object.set(BaseClass._archive, false);
        }
    }

    public static settUserAsOwner(request: parse.Cloud.BeforeSaveRequest) {
        if (!request.object.has('owner') && request.user) {
            request.object.set('owner', request.user);
        }
    }

}

