import * as moment from 'moment-timezone';
export const API_FUNCTION_RESAVE = "re-save";

Parse.Cloud.job(API_FUNCTION_RESAVE, async (request) => {

    const { params, message: msgCallback } = request;

    const className = params.class;

    if (!className) {
        throw "Missing class param";
    }

    console.log(`Re-saving ${className}`);

    let query = new Parse.Query(className);
    query.greaterThan('createdAt', moment().subtract(90, 'days').toDate());
    
    let totalCount = await query.count({useMasterKey: true});
    let saveCount = 0;

    msgCallback(`Saving ${totalCount} objects from class ${className}`);


    return query.each((object) => {
        saveCount++;

        if (saveCount % 100 === 0) {
            msgCallback(`Re-saved ${saveCount}/${totalCount} objects from class ${className}`)
        }

        return object.save(null, {useMasterKey: true});
    }, {useMasterKey: true});


});
