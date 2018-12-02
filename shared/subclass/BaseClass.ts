import * as _ from "lodash";
import {User} from "./User";

export abstract class BaseClass extends Parse.Object {

    static readonly _objectId = 'objectId';
    static readonly _createdAt = 'createdAt';
    static readonly _ACL = '_ACL';

    static readonly _owner = 'owner';
    static readonly _archive = 'archive';


    protected constructor(className?: string, options?: any) {
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

    // TODO: select should be keyof T
    copyAttributes<T extends BaseClass>(fromObject: Parse.Object, ...select: string[]) {
        Object.keys(fromObject.attributes).forEach((fieldName: string) => {
            if (!select || _.includes(select, fieldName)) {
                this.set(fieldName, fromObject.get(fieldName));
            }
        });
    }

}