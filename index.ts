require("dotenv").config({ path: 'local.env' });
let requireEnv = require("require-environment-variables");
requireEnv([
  'APP_ID',
  'APP_URL',
  'FILE_KEY',
  'MASTER_KEY',
  'SERVER_URL',
  'MONGODB_URI',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'GOOGLE_GEOCODE_API_KEY',
  'SENDGRID_API_KEY',
  'CPSMS_API_KEY',
  'GOOGLE_PROJECT_ID',
  'GOOGLE_SERVER_API_KEY',
  'S3_BUCKET'
]);

// Example express application adding the parse-server module to expose Parse
// compatible API routes.

let express = require('express');
let ParseServer = require('parse-server').ParseServer;
let path = require('path');

let databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

let api = new ParseServer({
  databaseURI: databaseUri, //'mongodb://localhost:27017/dev',
  cloud: './cloud/main.ts',
  appId: process.env.APP_ID || 'guardswift',
  fileKey: process.env.FILE_KEY,
  masterKey: process.env.MASTER_KEY, // Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL, // Don't forget to change to https if needed
  enableSingleSchemaCache: true, // Should decrease memory usage
  liveQuery: {
    classNames: ["Task", "EventLog", "Guard", "Client"] // List of classes to support for query subscriptions
  },
  filesAdapter: "@parse/s3-files-adapter",
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

let app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
let mountPath = process.env.PARSE_MOUNT || '/parse';
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
let apiRouter = express.Router();
let bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

apiRouter.get('/report/:id', require('./api/pdf/pdfreport').toPdf);
apiRouter.post('/pdfmake', require('./api/pdf/pdfmake').pdfMake);

apiRouter.get('/cpsms',
    require('./api/cpsms').receive
);
app.use('/api', apiRouter);


let port = process.env.PORT || 1337;
let httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('GuardSwift server running on port ' + port + '.');
});

// This will enable the Live Query real-time server
//ParseServer.createLiveQueryServer(httpServer);