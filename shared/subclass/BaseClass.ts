import * as _ from "lodash";
import {User} from "./User";
import ACL = Parse.ACL;

export abstract class BaseClass extends Parse.Object {

    static readonly _owner = 'owner';
    static readonly _archive = 'archive';

    ACL = 'ACL';

    constructor(className?: string, options?: any) {
        super(className, options)
    }

    get owner(): User {
        return this.get(BaseClass._owner)
    }

    set owner(user: User) {
        this.set(BaseClass._owner, user);
    }

    get archive(): boolean {
        return this.get(BaseClass._archive);
    }

    set archive(archive: boolean) {
        this.set(BaseClass._archive, archive);
    }

    copyAttributes<T extends BaseClass>(fromObject: Parse.Object, select?: [keyof T]) {
        Object.keys(fromObject.attributes).forEach((fieldName) => {
            if (!select || _.includes(select, fieldName)) {
                this.set(fieldName, fromObject.get(fieldName));
            }
        });
    }

    setUserACL(user: Parse.User) {
        let acl = new Parse.ACL();
        acl.setReadAccess(user.id, true);
        acl.setWriteAccess(user.id, true);
        acl.setPublicReadAccess(false);
        acl.setPublicWriteAccess(false);


        this.setACL(acl);
    }

}