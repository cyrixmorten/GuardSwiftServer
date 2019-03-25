export const API_FUNCTION_RESAVE = "re-save";

Parse.Cloud.define(API_FUNCTION_RESAVE, async (request) => {

    let className = request.params.class;

    if (!className) {
        throw "Missing class param";
    }

    console.log(`Re-saving ${className}`);

    let query = new Parse.Query(className);

    let totalCount = await query.count({useMasterKey: true});
    let saveCount = 0;

    console.log(`Saving ${totalCount} objects from class ${className}`);
    //query.greaterThan('createdAt', moment().subtract(30, 'days').toDate());

    return query.each((object) => {
        saveCount++;

        if (saveCount % 10 === 0) {
            console.log(`-- Re-saved ${saveCount}/${totalCount} objects from class ${className} --`)
        }

        return object.save(null, {useMasterKey: true});
    }, {useMasterKey: true});


});
