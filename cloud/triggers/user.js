Parse.Cloud.beforeSave("_User", function (request, response) {
    let user = request.object;
    if (!user.existed()) {
        if (!user.has('timeZone')) {
            // TODO investigate removal
            user.set('timeZone', 'Europe/Copenhagen');
        }
    }
    response.success();
});
//# sourceMappingURL=user.js.map