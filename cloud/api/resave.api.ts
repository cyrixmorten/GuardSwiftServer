import moment = require('moment');

export const API_FUNCTION_RESAVE = "re-save"

Parse.Cloud.define(API_FUNCTION_RESAVE, function(request, response)  {

    let className = request.params.class;

    if (!className) {
        response.error("Missing class param")
    }

    console.log(`Re-saving ${className}`);

    let query = new Parse.Query(className);

    let totalCount = 0;
    let saveCount = 0;

    //query.greaterThan('createdAt', moment().subtract(30, 'days').toDate());
    query.count({useMasterKey: true}).then((count) => {
        totalCount = count;
        console.log(`Saving ${totalCount} objects from class ${className}`);
    })
        .then(() => {
        return query.each( (object) => {
            saveCount++;

            if (saveCount % 10 === 0) {
                console.log(`


                -- Re-saved ${saveCount}/${totalCount} objects from class ${className} --


                `)
            }

            return object.save(null, {useMasterKey:true});
        }, {useMasterKey: true});
    })
        .then(() => {
        console.log('success');
        response.success(`Successfully resaved ${totalCount} objects in class ${className}`);
    }, (error) => {
        console.error(error);
        response.error(error);
    });


});
