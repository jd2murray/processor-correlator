import Express from 'express';

const _logger = require ( 'log4js' ).getLogger ( path.basename ( __filename ) );

var version  = require( '../../package').version;

class Version {
    constructor (app : Express) {
        //Serve the version version.
        app.get('/version', function(req, res) {
            var ret = {'cs-correlator-version': version};
            _logger.info('requested version; giving:' + JSON.stringify(ret));
            res.json(ret);
        });
    }
}

export default Version;