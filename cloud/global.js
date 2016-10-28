var _ = require('lodash');

module.exports = {
		GOOGLE_GEOCODE_API_KEY : process.env.GOOGLE_GEOCODE_API_KEY,
		PARSE_APPLICATION_ID: process.env.APP_ID,
		PARSE_MASTER_KEY: process.env.MASTER_KEY,
		isDev : function() {
			return _.lowerCase(process.env.DEPLOYMENT_MODE) !== 'production';
		}
};

