
Parse.Cloud.afterSave("DistrictWatch", function (request) {
    var DistrictWatch = request.object;
    if (!DistrictWatch.has('createdDay')) {
        console.log("Create new DistrictWatch");
        Parse.Cloud.run("createDistrictWatchStarted", {
            objectId: DistrictWatch.id
        });
    }
});

Parse.Cloud.afterDelete("DistrictWatch", function(request) {
  query = new Parse.Query("DistrictWatchStarted");
  query.equalTo("districtWatch", request.object);
  query.doesNotExist('timeEnded');
  query.find().then(function(districtWatchesStarted) {
  		var now = new Date();
  		districtWatchesStarted.forEach(function(districtWatch) {
  			districtWatch.set('timeEnded', now);
  			districtWatch.save();
  		});
  }, function(error) {
  		console.error("Error finding CircuitStarted " + error.code + ": " + error.message);
  });
});