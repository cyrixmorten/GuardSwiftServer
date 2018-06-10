import * as _ from "lodash";
import {sleep} from "../utils/sleep";

export const API_FUNCTION_RESAVE = "re-save";

Parse.Cloud.define(API_FUNCTION_RESAVE, async (request, response) => {

    let className = request.params.class;
    let throttleMs = _.toSafeInteger(request.params.throttleMs);

    if (!className) {
        response.error("Missing class param")
    }

    console.log(`Re-saving ${className}`);

    let query = new Parse.Query(className);

    let totalCount = await query.count({useMasterKey: true});
    let saveCount = 0;

    console.log(`Saving ${totalCount} objects from class ${className}`);

    return query.each(async (object) => {
        saveCount++;

        if (throttleMs) {
            await sleep(throttleMs);
        }

        if (saveCount % 10 === 0) {
            console.log(`


                -- Re-saved ${saveCount}/${totalCount} objects from class ${className} --


                `)
        }

        return object.save(null, {useMasterKey: true}).catch(() => 'ignore errors');
    }, {useMasterKey: true})
        .then(() => {
            console.log('success');
            response.success(`Successfully resaved ${totalCount} objects in class ${className}`);
        }, (error) => {
            console.error(error);
            response.error(error);
        });


});
