

Parse.Cloud.define("re-save", function(request, status)  {

    let className = request.params.class;

    if (!className) {
        status.error("Missing class param")
    }

    console.log(`Re-saving ${className}`);

    let query = new Parse.Query(className);

    let totalCount = 0;
    let saveCount = 0;

    query.count({useMasterKey: true}).then((count) => {
        totalCount = count;
        console.log(`Saving ${totalCount} objects from class ${className}`);
    }).then(() => {
        return query.each( (object) => {
            saveCount++;

            if (saveCount % 100 === 0) {
                console.log(`
                   
                   
                -- Re-saved ${saveCount}/${totalCount} objects from class ${className} --
                   
                   
                `)
            }

            return object.save(null, {useMasterKey:true});
        }, {useMasterKey: true});
    }).then(() => {
        status.success(`Successfuly resaved ${totalCount} objects in class ${className}`);
    }, (error) => {
        console.error(error);
        status.error(error);
    });


});
