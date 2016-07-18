import DatasetProcessor from '../dataset/dataset';
import Camera from '../initialIEO/camera';

import type {DatasetStateType} from '../dataset/state';
import {ProcessingState} from '../dataset/state';

let path = require('path');
const _logger = require ( 'log4js' ).getLogger ( path.basename ( __filename ) );

let REST_NOT_ALLOWED = 405; //We'll use this when an invalid op was requested due to current state.

class Dataset {
    _workingDir : string;
    _C3DPath : string;

    _dsProcessor : ?DatasetProcessor;
    
    constructor (app : Object, workingDir : string, C3DPath : string) {
        this._workingDir = workingDir;
        this._dsProcessor = null;
        this._C3DPath = C3DPath;

        app.all('/dataset/open', this.open.bind(this));
        app.all('/dataset/reset', this.reset.bind(this));
        app.all('/dataset/triangulate', this.triangulate.bind(this));
        app.all('/dataset/genDem', this.generateDEM.bind(this));
        app.all('/dataset/genMosaic', this.generateMosaic.bind(this));
        app.all('/dataset/state', this.state.bind(this));
    }
    
    open(req, res) : void {
        _logger.info('Opening dataset');

        //Just return an error if we already have a dataset.
        if(this._dsProcessor) {
            _logger.error('Attempt to open a dataset when one is already open!');
            res.json({
                    processingState : ProcessingState.ERROR
                });
            res.statusCode = REST_NOT_ALLOWED;
            return;
        }
        
        //TODO: Get the bucket name from the parameters;  Download 
        //TODO: Get the camera config from the parameters;

        //Initialize the dsProcessor.
        this._dsProcessor = new DatasetProcessor(
            //this._workingDir + '\\InputData', 
            'e:\\Correlator3dWork\\Datasets\\Benjamin_EXIF_KAPPA\\',
            this._workingDir,
            this._C3DPath,
            new Camera({
                name: 'FixedCamera', 
                imageWidth: 1920, 
                imageHeight: 1080, 
                focalLength: 2.2, 
                pixelSize: 2.4
            }));
        
        this._dsProcessor.initialize();
        res.json({
            status: this._dsProcessor.state
        });
    }

    reset(req, res) : void {
        //TODO: Delete the data on filesystem.
        //TODO: Kill the processor.
        //Enhance dataprocessor for cleanup.
    }

    state(req, res) : void {
        //Simply give the state of the processor back to the client.
        if(this._dsProcessor) {
            res.json(this._dsProcessor.state);
        } else {
            _logger.error('Cannot get state on non-existent dataset; open first!');
            res.json({processingState : ProcessingState.ERROR});
            res.statusCode = REST_NOT_ALLOWED;
        }
    }

    triangulate(req, res) : void {
        _logger.info('Initiating triangulation');
        if(!this._dsProcessor || this._dsProcessor.state.processingState != ProcessingState.IDLE) {
            _logger.error('Cannot initiate triangulation b/c either no dataset or datasetProcessor not idle.!');
            let result = {};
            if(!this._dsProcessor) {
                result = {processingState : ProcessingState.ERROR}
            } else {
                result = this._dsProcessor.state;
            }
            res.json(result);
            res.statusCode = REST_NOT_ALLOWED;
            return;
        }

        //Initiate triangulation and return the state.
        this._dsProcessor.triangulate();
        res.json(this._dsProcessor.state);
    }
    
    generateDEM(req, res) : void {
        _logger.info('Initiating DSMDTM');
        if(!this._dsProcessor || this._dsProcessor.state.processingState != ProcessingState.IDLE) {
            _logger.error('Cannot initiate DEM b/c either no dataset or datasetProcessor not idle.!');
            let result = {};
            if(!this._dsProcessor) {
                result = {processingState : ProcessingState.ERROR}
            } else {
                result = this._dsProcessor.state;
            }
            res.json(result);
            res.statusCode = REST_NOT_ALLOWED;
            return;
        }

        //Initiate DEM generation and return the state.
        this._dsProcessor.generateDSMDTM();
        res.json(this._dsProcessor.state);

        //TODO: Upload results (DTM/DSM) to specified bucket.
    }
    
    //Will generate the mosaic using initial triangulation if DSM/DTM have not been generated.
    ////OTHERWISE, uses the results of DSM/DTM
    generateMosaic(req, res) : void {
        _logger.info('Initiating Mosaic/LAS generation');
        if(!this._dsProcessor || this._dsProcessor.state.processingState != ProcessingState.IDLE) {
            _logger.error('Cannot initiate DEM b/c either no dataset or datasetProcessor not idle.!');
            let result = {};
            if(!this._dsProcessor) {
                result = {processingState : ProcessingState.ERROR}
            } else {
                result = this._dsProcessor.state;
            }
            res.json(result);
            res.statusCode = REST_NOT_ALLOWED;
            return;
        }

        //TODO: check to see if DEM available before assuming it is.  If not, use the initial DEM.
        //Initiate Mosaic generation and return the state.
        this._dsProcessor.generateMosaic();
        res.json(this._dsProcessor.state);

        //TODO: Upload results (orthomosaic and .las) to specified bucket.
    }
}

export default Dataset;
