Parse.Cloud.beforeSave("_User", function (request, response) {
    var user = request.object;
    if (user.isNew()) {
        if (!user.has('timeZone')) {
            user.set('timeZone', 'Europe/Copenhagen');
        }
    }

    response.success();
});