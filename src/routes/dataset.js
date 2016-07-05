import Express from 'express';

const _logger = require ( 'log4js' ).getLogger ( path.basename ( __filename ) );

type datasetStatesType = 'EMPTY' | 'OPENING' | 'TRIANGULATING' | 'IDLE';

DatasetStates = {
    EMPTY : 'EMPTY',
    OPENING: 'OPENING',
    TRIANGULATING: 'TRIANGULATING',
    IDLE: 'IDLE'
};

class Dataset {
    state : datasetStatesType;
    
    constructor (app : Express) {
        this.state = DatasetStates.EMPTY;

        app.all('/dataset/open', this.open);
        app.all('/dataset/reset', this.reset);
        app.all('/dataset/triangulate', this.triangulate);
        app.all('/dataset/genDem', this.generateDSMDTM);
        app.all('/dataset/genMosaic', this.generateMosaic);
    }


    open(req, res) : void {
        //Get the bucket name from the parameters.
        //Download 
        //Create initialIO
    }

    reset(req, res) : void {

    }
    triangulate(req, res) : void {
        _logger.info('Initiating triangulation');
        res.json(ret);

        //Run triangulate
        //Check for errors
        //TODO: determine upload results so that user can run other steps at future time after downloading imagery
        //  together with these intermediate.
    }
    
    generateDSMDTM(req, res) : void {
        //Run DSMGen folowed by DTM Gen
        //Check for errors
        //Upload results to specified bucket.
    }
    
    //Will generate the mosaic using initial triangulation if DSM/DTM have not been generated.
    ////OTHERWISE, uses the results of DSM/DTM
    generateMosaic(req, res) : void {
        //Run ortho generation, run mosaic generation with point cloud on.
        //Check results
        //Upload results (orthomosaic and .las) to specified bucket.
    }
}

export default Dataset;
