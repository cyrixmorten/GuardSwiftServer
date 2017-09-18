require("dotenv").config({ path: 'local.env' });
var requireEnv = require("require-environment-variables");
requireEnv([
  'APP_ID',
  'APP_URL',
  'FILE_KEY',
  'MASTER_KEY',
  'SERVER_URL',
  'MONGODB_URI',
  'S3_KEY',
  'S3_SECRET',
  'GOOGLE_GEOCODE_API_KEY',
  'SENDGRID_API_KEY',
  'TWILIO_SID',
  'TWILIO_AUTH_TOKEN',
  'CPSMS_API_KEY',
  'GOOGLE_PROJECT_ID',
  'GOOGLE_SERVER_API_KEY'
]);

// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var S3Adapter = require('parse-server').S3Adapter;
var ParseServer = require('parse-server').ParseServer;
var path = require('path');

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}


var api = new ParseServer({
  databaseURI: databaseUri, //'mongodb://localhost:27017/dev',
  cloud: './cloud/main.js',
  appId: process.env.APP_ID || 'guardswift',
  fileKey: process.env.FILE_KEY,
  masterKey: process.env.MASTER_KEY, // Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL, // Don't forget to change to https if needed
  liveQuery: {
    classNames: ["Task"] // List of classes to support for query subscriptions
  },
  filesAdapter: new S3Adapter(
      process.env.S3_KEY,
      process.env.S3_SECRET,
      process.env.S3_BUCKET || 'guardswift',
      { directAccess: true }
  ),
  push: {
      android: {
          senderId: process.env.GOOGLE_PROJECT_ID,
          apiKey: process.env.GOOGLE_SERVER_API_KEY
      }
      // ,
      // adapter: require('parse-server-push-adapter')
  }
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});


// API
var apiRouter = express.Router();
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

apiRouter.get('/report/:id', require('./api/pdf/pdfreport'));
apiRouter.post('/pdfmake', require('./api/pdf/pdfmake'));
// apiRouter.post('/sms-send', require('./api/twilio').send);
apiRouter.post('/twilio',
    require('twilio').webhook({ validate: false }),
    require('./api/twilio').receive
);
apiRouter.get('/cpsms',
    require('./api/cpsms').receive
);
app.use('/api', apiRouter);



var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});

// This will enable the Live Query real-time server
// ParseServer.createLiveQueryServer(httpServer);


