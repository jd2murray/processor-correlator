import Version from './routes/version';
import Time from './routes/time';
import Dataset from './routes/dataset';

var express = require('express');
var app = express();

//Logger setup
var log4js = require('log4js');
var _logger = log4js.getLogger('cs-correlator');
log4js.setGlobalLogLevel(log4js.levels.DEBUG);

// Constants
let DEFAULT_PORT = 8085;
var port = process.env.CORRELATOR_PORT;
if(port === undefined) {
    _logger.warn('No CORRELATOR set, defaulting to: ' + DEFAULT_PORT);
    port = DEFAULT_PORT;
}

let DEFAULT_DATA_DIR = 'e:\\Projects\\Correlator\\generated\\correlatorWork';
var baseDataDir = process.env.CORRELATOR_DATA_DIR;
if(baseDataDir === undefined) {
    _logger.warn('No CORRELATOR_DATA_DIR set, defaulting to: ' + DEFAULT_DATA_DIR);
    baseDataDir = DEFAULT_DATA_DIR;
}

let DEFAULT_C3D_PATH = 'e:\\Correlator3D\\C3d.exe';
var C3DPath = process.env.CORRELATOR_EXE_PATH;
if(C3DPath === undefined) {
    _logger.warn('No CORRELATOR_EXE_PATH set, defaulting to: ' + DEFAULT_C3D_PATH);
    C3DPath = DEFAULT_C3D_PATH;
}

//Allow cross-origin for all requests.
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

//Let express know that we'll sit behind a proxy in production.
app.enable('trust proxy');

let routes = {
    dataset: new Dataset(app, baseDataDir, C3DPath),
    version: new Version(app),
    time: new Time(app)
};

app.listen ( port, function ()
{
    _logger.info ( 'Running on http://localhost:' + port );
} );