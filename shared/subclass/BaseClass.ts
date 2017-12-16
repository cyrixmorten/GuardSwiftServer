import * as _ from "lodash";

export abstract class BaseClass extends Parse.Object {

    static readonly _createdAt = 'createdAt';
    static readonly _updatedAt = '_updatedAt';

    static readonly _owner = 'owner';
    static readonly _archive = 'archive';

    constructor(className?: string, options?: any) {
        super(className, options)
    }

    get owner(): Parse.User {
        return this.get(BaseClass._owner)
    }

    set owner(user: Parse.User) {
        this.set(BaseClass._owner, user);
    }

    get archive(): boolean {
        return this.get(BaseClass._archive);
    }

    set archive(archive: boolean) {
        this.set(BaseClass._archive, archive);
    }

    copyAttributes(fromObject: Parse.Object, select?: string[]) {
        Object.keys(fromObject.attributes).forEach((fieldName) => {
            if (!select || _.includes(select, fieldName)) {
                this.set(fieldName, fromObject.get(fieldName));
            }
        });
    }

}