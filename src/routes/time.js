let path = require('path');

const _logger = require ( 'log4js' ).getLogger ( path.basename ( __filename ) );

class Time {
    constructor (app : Object) {
        //Serve a server time
        app.get('/serverTime', function(req, res) {
            var ret = {serverTime: new Date().getTime()};
            _logger.info('requested server time; giving:' + JSON.stringify(ret));
            res.json(ret);
        });

    }
}

export default Time;
